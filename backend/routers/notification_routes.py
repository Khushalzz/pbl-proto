from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from db import get_collection
from services.notification_service import get_recent_emails

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
def get_user_notifications(user: dict = Depends(get_current_user)):
    notifications_col = get_collection("notifications")
    notes = notifications_col.find(
        {"$or": [{"recipient_id": user["_id"]}, {"recipient_email": user["email"]}]},
        sort=[("created_at", -1)],
        limit=30
    )
    return notes

@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    notifications_col = get_collection("notifications")
    notifications_col.update_one({"_id": notification_id}, {"$set": {"read": True}})
    return {"success": True}

@router.post("/read-all")
def mark_all_read(user: dict = Depends(get_current_user)):
    notifications_col = get_collection("notifications")
    notifications_col.update_one(
        {"$or": [{"recipient_id": user["_id"]}, {"recipient_email": user["email"]}]},
        {"$set": {"read": True}}
    )
    return {"success": True}

@router.get("/emails")
def get_email_logs():
    """Returns the simulated email dispatch log for local testing."""
    return get_recent_emails()
