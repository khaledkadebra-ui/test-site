# Import all models so SQLAlchemy metadata discovers every table.
# Required for Alembic autogenerate and for relationship resolution.

from app.models.user import User
from app.models.company import Company
from app.models.submission import DataSubmission, EnergyData, TravelData, ProcurementData, ESGPolicyData
from app.models.report import Report, ReportResults
from app.models.audit_log import AuditLog

__all__ = [
    "User", "Company",
    "DataSubmission", "EnergyData", "TravelData", "ProcurementData", "ESGPolicyData",
    "Report", "ReportResults",
    "AuditLog",
]
