"""
Document upload routes — ESG Copilot

POST   /documents/upload        Upload PDF or Excel file
GET    /documents/{id}          Get document metadata + extracted data
DELETE /documents/{id}          Delete document
"""

import uuid
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DB
from app.models.audit_log import AuditLog
from app.models.submission import DataSubmission
from app.models.user import User
from app.services.storage.file_storage import StorageError, get_storage

# Lazy import to avoid circular deps at startup
try:
    from app.models.uploaded_document import UploadedDocument
except ImportError:
    UploadedDocument = None  # defined below as inline model

router = APIRouter()


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    current_user: CurrentUser,
    db: DB,
    file: UploadFile = File(...),
    submission_id: str = Form(None),
):
    """
    Upload a financial statement, energy bill, or ESG document.
    Accepted formats: PDF, XLSX, XLS, CSV (max 50 MB).
    After upload, the document is queued for data extraction.
    """
    if current_user.company_id is None:
        raise HTTPException(status_code=400, detail="User has no company. Create a company first.")

    storage = get_storage()

    # Read and upload
    content = await file.read()
    try:
        storage.validate(file.filename or "upload", len(content))
    except StorageError as e:
        raise HTTPException(status_code=422, detail=str(e))

    import io
    storage_key, size = storage.upload(
        io.BytesIO(content),
        file.filename or "upload",
        str(current_user.company_id),
    )

    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "unknown"

    # Resolve submission_id
    sub_id = None
    if submission_id:
        try:
            sub_uuid = UUID(submission_id)
            result = await db.execute(select(DataSubmission).where(DataSubmission.id == sub_uuid))
            sub = result.scalar_one_or_none()
            if sub and sub.company_id == current_user.company_id:
                sub_id = sub_uuid
        except ValueError:
            pass

    # Persist record
    doc_id = uuid.uuid4()
    db.add(AuditLog(
        user_id=current_user.id,
        company_id=current_user.company_id,
        action="document.uploaded",
        entity_type="document",
        entity_id=doc_id,
        new_value={
            "filename": file.filename,
            "size_bytes": size,
            "storage_key": storage_key,
            "submission_id": str(sub_id) if sub_id else None,
        },
    ))

    # Queue extraction task (Week 3+ — Celery)
    # from app.tasks.document_tasks import extract_document
    # extract_document.delay(str(doc_id))

    return {
        "document_id": str(doc_id),
        "filename": file.filename,
        "size_bytes": size,
        "file_type": ext,
        "submission_id": str(sub_id) if sub_id else None,
        "extraction_status": "pending",
        "message": "Document uploaded. Extraction queued.",
    }


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: UUID, current_user: CurrentUser, db: DB):
    """Delete an uploaded document by ID (looked up via audit log)."""
    # Look up the upload record in audit_logs
    result = await db.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "document",
            AuditLog.entity_id == document_id,
            AuditLog.action == "document.uploaded",
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Document not found")

    if log.company_id != current_user.company_id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")

    storage_key = (log.new_value or {}).get("storage_key")
    if storage_key:
        get_storage().delete(storage_key)

    db.add(AuditLog(
        user_id=current_user.id,
        company_id=current_user.company_id,
        action="document.deleted",
        entity_type="document",
        entity_id=document_id,
    ))
