from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from auth import require_roles
from db import get_collection
from services.audit_service import log_audit_event

router = APIRouter(prefix="/api/admin", tags=["Administrator"])

@router.get("/users")
def get_all_users(user: dict = Depends(require_roles(["Administrator"]))):
    users_col = get_collection("users")
    users = users_col.find(sort=[("created_at", -1)])
    return [
        {
            "id": u["_id"],
            "email": u["email"],
            "full_name": u["full_name"],
            "phone": u.get("phone", ""),
            "role": u["role"],
            "department": u.get("department"),
            "trust_score": u.get("trust_score", 100),
            "created_at": u.get("created_at")
        }
        for u in users
    ]

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: Dict[str, str],
    user: dict = Depends(require_roles(["Administrator"]))
):
    users_col = get_collection("users")
    target = users_col.find_one({"_id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    new_role = payload.get("role")
    new_dept = payload.get("department")

    update_set = {}
    if new_role:
        update_set["role"] = new_role
    if new_dept is not None:
        update_set["department"] = new_dept

    users_col.update_one({"_id": user_id}, {"$set": update_set})

    log_audit_event(
        action="ADMIN_UPDATE_USER_ROLE",
        user_id=user["_id"],
        user_email=user["email"],
        user_role=user["role"],
        details={"target_user_id": user_id, "new_role": new_role, "new_dept": new_dept}
    )

    return {"success": True, "message": "User role updated successfully."}

@router.get("/departments")
def get_departments():
    depts_col = get_collection("departments")
    return depts_col.find()

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    user: dict = Depends(require_roles(["Administrator"]))
):
    audit_col = get_collection("audit_logs")
    logs = audit_col.find(sort=[("timestamp", -1)], limit=limit)
    return logs
