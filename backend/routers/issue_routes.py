import os
import shutil
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from auth import get_current_user
from config import UPLOAD_DIR
from db import get_collection
from models import DuplicateCheckRequest, IssueCreate
from services.ai_service import analyze_issue_image, check_duplicate_issues, predict_issue_priority
from services.audit_service import log_audit_event
from services.notification_service import send_notification

router = APIRouter(prefix="/api/issues", tags=["Issues"])

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    # Validate extension (SRS DR-003: JPEG, PNG, WebP)
    valid_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in valid_extensions:
        raise HTTPException(status_code=400, detail="Invalid image format. Supported formats: JPEG, PNG, WebP.")

    filename = f"{uuid.uuid4()}{ext}"
    dest_path = UPLOAD_DIR / filename
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/uploads/{filename}"

    # Also run optional quick vision analysis if Gemini key is present
    vision_assessment = analyze_issue_image(str(dest_path))

    return {
        "image_url": image_url,
        "filename": filename,
        "vision_assessment": vision_assessment
    }

@router.post("/check-duplicate")
def check_duplicate(req: DuplicateCheckRequest):
    issues_col = get_collection("issues")
    all_issues = issues_col.find()
    result = check_duplicate_issues(
        title=req.title,
        description=req.description,
        category=req.category,
        lat=req.latitude,
        lon=req.longitude,
        existing_issues=all_issues
    )
    return result

@router.get("")
def list_issues(
    category: Optional[str] = None,
    status: Optional[str] = None,
    ward: Optional[str] = None,
    search: Optional[str] = None,
    reporter_id: Optional[str] = None
):
    issues_col = get_collection("issues")
    filter_doc = {}
    if category and category != "All":
        filter_doc["category"] = category
    if status and status != "All":
        filter_doc["status"] = status
    if ward and ward != "All":
        filter_doc["location.ward"] = ward
    if reporter_id:
        filter_doc["reporter_id"] = reporter_id

    issues = issues_col.find(filter_doc, sort=[("created_at", -1)])

    if search:
        search_lower = search.lower()
        issues = [
            i for i in issues
            if search_lower in i.get("title", "").lower() 
            or search_lower in i.get("description", "").lower()
            or search_lower in i.get("issue_id", "").lower()
            or search_lower in i.get("location", {}).get("address", "").lower()
        ]

    return issues

@router.get("/{issue_id}")
def get_issue(issue_id: str):
    issues_col = get_collection("issues")
    issue = issues_col.find_one({"$or": [{"_id": issue_id}, {"issue_id": issue_id}]})
    if not issue:
        raise HTTPException(status_code=404, detail="Civic issue report not found.")
    return issue

@router.post("")
def create_issue(req: IssueCreate, user: dict = Depends(get_current_user)):
    issues_col = get_collection("issues")
    count = issues_col.count_documents() + 1
    issue_number = f"CL-2026-{count:03d}"
    now_iso = datetime.utcnow().isoformat()

    # 1. AI Duplicate Check
    all_issues = issues_col.find()
    dup_check = check_duplicate_issues(
        title=req.title,
        description=req.description,
        category=req.category,
        lat=req.location.latitude,
        lon=req.location.longitude,
        existing_issues=all_issues
    )

    # 2. AI Priority and Routing Prediction
    ai_prediction = predict_issue_priority(
        title=req.title,
        description=req.description,
        category=req.category,
        verification_count=0,
        duplicate_count=1 if dup_check["is_duplicate"] else 0
    )

    new_issue = {
        "issue_id": issue_number,
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "location": req.location.dict(),
        "image_urls": req.image_urls,
        "reporter_id": user["_id"],
        "reporter_name": "",
        "reporter_email": user.get("email", ""),
        "status": "Reported",
        "priority": ai_prediction["priority"],
        "assigned_department": ai_prediction.get("recommended_department"),
        "assigned_engineer_id": None,
        "assigned_engineer_name": None,
        "verification_count": 0,
        "credibility_score": float(user.get("trust_score", 100)),
        "ai_analysis": {
            "duplicate_checked": True,
            "suspected_duplicate": dup_check["is_duplicate"],
            "suspected_duplicate_of": dup_check.get("matched_issue", {}).get("issue_id") if dup_check.get("matched_issue") else None,
            "duplicate_confidence": dup_check["confidence"],
            "predicted_priority": ai_prediction["priority"],
            "priority_score": ai_prediction["priority_score"],
            "recommended_department": ai_prediction["recommended_department"],
            "ai_rationale": ai_prediction["ai_rationale"]
        },
        "status_history": [
            {
                "status": "Reported",
                "updated_by": "Citizen",
                "timestamp": now_iso,
                "comment": "Issue submitted via CivicLens Citizen Portal."
            }
        ],
        "created_at": now_iso,
        "updated_at": now_iso
    }

    inserted = issues_col.insert_one(new_issue)

    # Notification to Citizen (FR-010, FR-030)
    send_notification(
        recipient_id=user["_id"],
        recipient_email=user["email"],
        title="Civic Issue Submitted",
        message=f"Your report '{req.title}' has been registered as {issue_number}. AI assigned priority: {ai_prediction['priority']}.",
        notification_type="submission_confirmation",
        link=f"/issues/{inserted['_id']}"
    )

    # Notification to Municipal Officers (FR-031)
    users_col = get_collection("users")
    officers = users_col.find({"role": "Municipal Officer"})
    for off in officers:
        send_notification(
            recipient_id=off["_id"],
            recipient_email=off["email"],
            title="New Civic Issue Requiring Review",
            message=f"New report {issue_number} ({req.category}) in {req.location.ward}. AI Priority: {ai_prediction['priority']}.",
            notification_type="officer_alert",
            link=f"/issues/{inserted['_id']}"
        )

    # Audit Log (OR-005)
    log_audit_event(
        action="ISSUE_CREATED",
        user_id=user["_id"],
        user_email=user["email"],
        user_role=user["role"],
        details={"issue_id": issue_number, "category": req.category, "priority": ai_prediction["priority"]}
    )

    return inserted
