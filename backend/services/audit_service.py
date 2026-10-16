from datetime import datetime
from typing import Any, Dict, Optional
from db import get_collection

def log_audit_event(
    action: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = "127.0.0.1"
):
    audit_col = get_collection("audit_logs")
    log_doc = {
        "timestamp": datetime.utcnow().isoformat(),
        "action": action,
        "user_id": user_id,
        "user_email": user_email,
        "user_role": user_role,
        "details": details or {},
        "ip_address": ip_address
    }
    audit_col.insert_one(log_doc)
    print(f"[AuditLog] {action} by {user_email or 'System'}")
