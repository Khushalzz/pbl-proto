from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, require_roles
from db import get_collection
from models import OfficerAssignRequest
from services.audit_service import log_audit_event
from services.notification_service import send_notification

router = APIRouter(prefix="/api/officer", tags=["Municipal Officer"])

@router.get("/issues")
def get_officer_issues(
    status: Optional[str] = None,
    department: Optional[str] = None,
    priority: Optional[str] = None,
    user: dict = Depends(require_roles(["Municipal Officer", "Administrator"]))
):
    issues_col = get_collection("issues")
    filter_doc = {}
    if status and status != "All":
        filter_doc["status"] = status
    if department and department != "All":
        filter_doc["assigned_department"] = department
    if priority and priority != "All":
        filter_doc["priority"] = priority

    issues = issues_col.find(filter_doc, sort=[("created_at", -1)])
    return issues

@router.get("/engineers")
def get_engineers(user: dict = Depends(require_roles(["Municipal Officer", "Administrator"]))):
    users_col = get_collection("users")
    engineers = users_col.find({"role": "Field Engineer"})
    return [
        {
            "id": e["_id"],
            "full_name": e["full_name"],
            "email": e["email"],
            "phone": e.get("phone", ""),
            "department": e.get("department")
        }
        for e in engineers
    ]

@router.post("/issues/{issue_id}/assign")
def assign_issue(
    issue_id: str,
    req: OfficerAssignRequest,
    user: dict = Depends(require_roles(["Municipal Officer", "Administrator"]))
):
    issues_col = get_collection("issues")
    users_col = get_collection("users")

    issue = issues_col.find_one({"$or": [{"_id": issue_id}, {"issue_id": issue_id}]})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")

    target_id = issue["_id"]
    engineer_name = None
    engineer_email = None

    if req.field_engineer_id:
        eng = users_col.find_one({"_id": req.field_engineer_id})
        if eng:
            engineer_name = ""
            engineer_email = eng.get("email")

    now_iso = datetime.utcnow().isoformat()
    new_priority = req.priority or issue.get("priority", "Medium")

    update_payload = {
        "status": "Assigned",
        "assigned_department": req.department,
        "assigned_engineer_id": req.field_engineer_id,
        "assigned_engineer_name": engineer_name,
        "priority": new_priority,
        "updated_at": now_iso
    }

    status_comment = f"Assigned to {req.department}"
    if req.field_engineer_id:
        status_comment += " (Field Engineer assigned)"
    if req.officer_notes:
        status_comment += f". Notes: {req.officer_notes}"
    if req.priority and req.priority != issue.get("priority"):
        status_comment += f" [Priority updated from {issue.get('priority')} to {new_priority}]"

    issues_col.update_one(
        {"_id": target_id},
        {
            "$set": update_payload,
            "$push": {
                "status_history": {
                    "status": "Assigned",
                    "updated_by": "Municipal Officer",
                    "timestamp": now_iso,
                    "comment": status_comment
                }
            }
        }
    )

    # 1. Notify reporting citizen (FR-025, FR-032)
    if issue.get("reporter_id"):
        send_notification(
            recipient_id=issue["reporter_id"],
            recipient_email=issue.get("reporter_email", ""),
            title="Issue Status Updated: Assigned",
            message=f"Your complaint {issue.get('issue_id')} has been assigned to {req.department}. A field engineer will handle the work.",
            notification_type="status_change",
            link=f"/issues/{target_id}"
        )

    # 2. Notify assigned engineer if selected
    if req.field_engineer_id and engineer_email:
        send_notification(
            recipient_id=req.field_engineer_id,
            recipient_email=engineer_email,
            title="New Field Task Assigned",
            message=f"You have been assigned issue {issue.get('issue_id')} ({issue.get('category')}) at {issue.get('location', {}).get('address')}.",
            notification_type="task_assignment",
            link=f"/issues/{target_id}"
        )

    log_audit_event(
        action="ISSUE_ASSIGNED",
        user_id=user["_id"],
        user_email=user["email"],
        user_role=user["role"],
        details={
            "issue_id": issue.get("issue_id"),
            "department": req.department,
            "engineer": engineer_name,
            "priority": new_priority
        }
    )

    return {"success": True, "message": "Issue assigned successfully."}
