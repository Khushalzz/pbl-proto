from collections import Counter
from fastapi import APIRouter
from db import get_collection

router = APIRouter(prefix="/api/analytics", tags=["Analytics & GIS"])

@router.get("/summary")
def get_analytics_summary():
    issues_col = get_collection("issues")
    users_col = get_collection("users")
    depts_col = get_collection("departments")

    issues = issues_col.find()
    total = len(issues)
    
    status_counts = Counter(i.get("status", "Reported") for i in issues)
    category_counts = Counter(i.get("category", "Other") for i in issues)
    priority_counts = Counter(i.get("priority", "Medium") for i in issues)
    ward_counts = Counter(i.get("location", {}).get("ward", "General") for i in issues)

    resolved_count = status_counts.get("Resolved", 0) + status_counts.get("Closed", 0)
    resolution_rate = round((resolved_count / total * 100), 1) if total > 0 else 0.0

    avg_verifications = round(sum(i.get("verification_count", 0) for i in issues) / total, 1) if total > 0 else 0.0

    return {
        "total_issues": total,
        "resolved_count": resolved_count,
        "pending_count": status_counts.get("Reported", 0) + status_counts.get("Assigned", 0),
        "in_progress_count": status_counts.get("In Progress", 0),
        "resolution_rate": resolution_rate,
        "avg_verifications_per_issue": avg_verifications,
        "status_breakdown": dict(status_counts),
        "category_breakdown": dict(category_counts),
        "priority_breakdown": dict(priority_counts),
        "ward_breakdown": dict(ward_counts),
        "total_citizens": users_col.count_documents({"role": "Citizen"}),
        "total_officers": users_col.count_documents({"role": "Municipal Officer"}),
        "total_engineers": users_col.count_documents({"role": "Field Engineer"})
    }

@router.get("/heatmaps")
def get_heatmaps():
    """
    Returns GIS heatmap points: [latitude, longitude, intensity]
    Intensity is calculated based on priority weight and community verifications.
    """
    issues_col = get_collection("issues")
    issues = issues_col.find()

    points = []
    priority_multipliers = {
        "Urgent": 1.0,
        "High": 0.8,
        "Medium": 0.5,
        "Low": 0.3
    }

    for iss in issues:
        loc = iss.get("location", {})
        lat = loc.get("latitude")
        lon = loc.get("longitude")
        if lat is not None and lon is not None:
            # Resolved issues produce less heatmap intensity
            status_factor = 0.2 if iss.get("status") in ["Resolved", "Closed"] else 1.0
            prio = iss.get("priority", "Medium")
            mult = priority_multipliers.get(prio, 0.5)
            ver_bonus = min(0.3, iss.get("verification_count", 0) * 0.05)

            intensity = round((mult + ver_bonus) * status_factor, 2)
            points.append({
                "latitude": lat,
                "longitude": lon,
                "intensity": intensity,
                "category": iss.get("category"),
                "priority": prio,
                "title": iss.get("title"),
                "issue_id": iss.get("issue_id"),
                "status": iss.get("status")
            })

    return points
