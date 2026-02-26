"""
Document upload routes — ESG Copilot

POST   /documents/upload          Upload PDF or Excel file
POST   /documents/{id}/extract    AI data extraction from uploaded document
GET    /documents             List all documents
DELETE /documents/{id}            Delete document
"""

import logging
import uuid
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DB
from app.models.audit_log import AuditLog
from app.models.submission import DataSubmission
from app.services.storage.file_storage import StorageError, get_storage

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", summary="List all documents for the current user's company")
async def list_documents(current_user: CurrentUser, db: DB):
    """Returns all uploaded documents for the authenticated user's company, newest first."""
    if not current_user.company_id:
        return []
    result = await db.execute(
        select(AuditLog).where(
            AuditLog.company_id == current_user.company_id,
            AuditLog.action == "document.uploaded",
        ).order_by(AuditLog.created_at.desc())
    )
    logs = result.scalars().all()
    docs = []
    for log in logs:
        v = log.new_value or {}
        docs.append({
            "id": str(log.entity_id),
            "filename": v.get("filename", "unknown"),
            "file_type": v.get("filename", "").rsplit(".", 1)[-1].lower() if "." in v.get("filename", "") else "unknown",
            "size_bytes": v.get("size_bytes", 0),
            "submission_id": v.get("submission_id"),
            "extraction_status": v.get("extraction_status", "pending"),
            "created_at": log.created_at.isoformat(),
        })
    return docs


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    current_user: CurrentUser,
    db: DB,
    file: UploadFile = File(...),
    submission_id: str = Form(None),
):
    """
    Upload a financial statement, energy bill, or ESG document.
    Accepted formats: PDF, JPG, PNG (max 50 MB).
    After upload, call POST /documents/{id}/extract to run AI extraction.
    """
    if current_user.company_id is None:
        raise HTTPException(status_code=400, detail="User has no company. Create a company first.")

    storage = get_storage()
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
            "extraction_status": "pending",
        },
    ))
    await db.commit()

    return {
        "document_id": str(doc_id),
        "filename": file.filename,
        "size_bytes": size,
        "file_type": ext,
        "submission_id": str(sub_id) if sub_id else None,
        "extraction_status": "pending",
        "message": "Dokument uploadet. Kald /extract for at køre AI-udtræk.",
    }


@router.post("/{document_id}/extract", summary="AI extraction of ESG data from a document")
async def extract_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: DB,
    document_type: Literal[
        "electricity_bill", "gas_invoice", "water_bill",
        "fuel_receipt", "waste_invoice", "general"
    ] = Form("general"),
):
    """
    Run Claude vision AI to extract structured ESG data from an uploaded document.

    document_type hint (improves accuracy):
    - electricity_bill  → kWh + billing period
    - gas_invoice       → m³ + billing period
    - water_bill        → m³ + billing period
    - fuel_receipt      → diesel/petrol litres
    - waste_invoice     → waste tonnes + recycling %
    - general           → any ESG-relevant values
    """
    result = await db.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "document",
            AuditLog.entity_id == document_id,
            AuditLog.action == "document.uploaded",
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Dokument ikke fundet")

    if log.company_id != current_user.company_id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Adgang nægtet")

    storage_key = (log.new_value or {}).get("storage_key")
    filename = (log.new_value or {}).get("filename", "")
    if not storage_key:
        raise HTTPException(status_code=422, detail="Dokument har ingen storage-nøgle — upload igen")

    ext = f".{filename.rsplit('.', 1)[-1].lower()}" if "." in filename else ""
    supported = {".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"}
    if ext not in supported:
        raise HTTPException(
            status_code=422,
            detail=f"AI-udtræk understøtter kun PDF og billedfiler. Fik: '{ext}'",
        )

    storage = get_storage()
    try:
        file_bytes = storage.read(storage_key)
    except Exception as e:
        logger.error("Failed to read document %s: %s", storage_key, e)
        raise HTTPException(status_code=500, detail="Kunne ikke hente dokument fra storage")

    from app.services.ai.document_extractor import extract_document_data
    try:
        extraction = await extract_document_data(
            file_bytes=file_bytes,
            file_extension=ext,
            document_type=document_type,
        )
    except Exception as e:
        logger.error("Extraction failed for document %s: %s", document_id, e)
        raise HTTPException(status_code=503, detail="AI-udtræk mislykkedes — prøv igen")

    db.add(AuditLog(
        user_id=current_user.id,
        company_id=current_user.company_id,
        action="document.extracted",
        entity_type="document",
        entity_id=document_id,
        new_value={
            "document_type": document_type,
            "confidence": extraction["confidence"],
            "fields_found": sum(1 for v in extraction["fields"].values() if v is not None),
        },
    ))
    await db.commit()

    return {
        "document_id": str(document_id),
        "document_type": document_type,
        "fields": extraction["fields"],
        "confidence": extraction["confidence"],
        "raw_text_excerpt": extraction["raw_text_excerpt"],
        "fields_found": sum(1 for v in extraction["fields"].values() if v is not None),
    }


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: UUID, current_user: CurrentUser, db: DB):
    """Delete an uploaded document."""
    result = await db.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "document",
            AuditLog.entity_id == document_id,
            AuditLog.action == "document.uploaded",
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Dokument ikke fundet")

    if log.company_id != current_user.company_id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Adgang nægtet")

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
    await db.commit()
