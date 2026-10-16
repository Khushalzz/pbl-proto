import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from db import get_collection
from models import VerificationCreate
from services.audit_service import log_audit_event
from services.notification_service import send_notification

router = APIRouter(prefix="/api/issues", tags=["Community Verification"])

@router.post("/{issue_id}/verify")
def verify_issue(issue_id: str, req: VerificationCreate, user: dict = Depends(get_current_user)):
    issues_col = get_collection("issues")
    verifications_col = get_collection("verifications")

    issue = issues_col.find_one({"$or": [{"_id": issue_id}, {"issue_id": issue_id}]})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")

    target_id = issue["_id"]

    # Check if this user already verified this issue (SRS FR-016)
    existing = verifications_col.find_one({"issue_id": target_id, "citizen_id": user["_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You have already verified this civic issue.")

    now_iso = datetime.utcnow().isoformat()
    verification_entry = {
        "_id": str(uuid.uuid4()),
        "issue_id": target_id,
        "citizen_id": user["_id"],
        "citizen_name": "",
        "citizen_trust_score": user.get("trust_score", 100),
        "comment": req.comment or "Community verification confirmed.",
        "verified_at": now_iso
    }
    verifications_col.insert_one(verification_entry)

    # Calculate updated verification count and credibility score (FR-017, FR-018)
    all_vers = verifications_col.find({"issue_id": target_id})
    v_count = len(all_vers)

    # Base credibility + 5 points per verification capped at 100
    base_credibility = issue.get("credibility_score", 80.0)
    new_credibility = min(100.0, base_credibility + (v_count * 4.0))

    # Boost AI priority score if verifications exceed thresholds
    ai_analysis = issue.get("ai_analysis", {})
    curr_score = ai_analysis.get("priority_score", 5.0)
    updated_score = min(10.0, curr_score + 0.3)
    ai_analysis["priority_score"] = round(updated_score, 1)

    issues_col.update_one(
        {"_id": target_id},
        {
            "$set": {
                "verification_count": v_count,
                "credibility_score": round(new_credibility, 1),
                "ai_analysis": ai_analysis
            },
            "$push": {
                "status_history": {
                    "status": issue.get("status"),
                    "updated_by": "Community member",
                    "timestamp": now_iso,
                    "comment": req.comment or "Community citizen confirmed existence of this issue."
                }
            }
        }
    )

    # Notify reporter about community upvote/verification
    if issue.get("reporter_id") != user["_id"]:
        send_notification(
            recipient_id=issue["reporter_id"],
            recipient_email=issue.get("reporter_email", ""),
            title="Community Verified Your Issue",
            message=f"A community member verified your report {issue.get('issue_id')}. Urgency boosted!",
            notification_type="verification",
            link=f"/issues/{target_id}"
        )

    log_audit_event(
        action="ISSUE_VERIFIED",
        user_id=user["_id"],
        user_email=user["email"],
        user_role=user["role"],
        details={"issue_id": issue.get("issue_id"), "verification_count": v_count}
    )

    return {
        "success": True,
        "verification_count": v_count,
        "credibility_score": round(new_credibility, 1),
        "message": "Thank you! Your verification has been recorded."
    }

@router.get("/{issue_id}/verifications")
def get_issue_verifications(issue_id: str):
    issues_col = get_collection("issues")
    verifications_col = get_collection("verifications")

    issue = issues_col.find_one({"$or": [{"_id": issue_id}, {"issue_id": issue_id}]})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")

    return verifications_col.find({"issue_id": issue["_id"]}, sort=[("verified_at", -1)])
