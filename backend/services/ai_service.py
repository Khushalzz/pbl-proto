import math
import os
import json
import re
from typing import Any, Dict, List, Optional
from config import GEMINI_API_KEY

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def _init_gemini_client():
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        # Use available model
        return genai.GenerativeModel('gemini-2.5-flash')
    except Exception as e:
        try:
            import google.generativeai as genai
            return genai.GenerativeModel('gemini-1.5-flash')
        except Exception:
            return None

def check_duplicate_issues(
    title: str,
    description: str,
    category: str,
    lat: float,
    lon: float,
    existing_issues: List[Dict[str, Any]],
    max_distance_meters: float = 400.0
) -> Dict[str, Any]:
    """
    SRS 4.3: Compare newly submitted issue with existing reports within geographic proximity.
    Returns: { is_duplicate: bool, potential_matches: list, rationale: str }
    """
    # 1. Spatial Pre-filtering
    nearby_issues = []
    for issue in existing_issues:
        loc = issue.get("location", {})
        i_lat = loc.get("latitude")
        i_lon = loc.get("longitude")
        if i_lat is not None and i_lon is not None:
            dist = haversine_distance_meters(lat, lon, i_lat, i_lon)
            if dist <= max_distance_meters and issue.get("status") not in ["Resolved", "Closed"]:
                nearby_issues.append((dist, issue))

    if not nearby_issues:
        return {
            "is_duplicate": False,
            "confidence": 0.0,
            "matched_issue": None,
            "potential_matches": [],
            "rationale": "No open civic issues found within 400 meters of this location."
        }

    # Sort nearby by distance
    nearby_issues.sort(key=lambda x: x[0])
    candidates = nearby_issues[:5]

    # 2. Check with Gemini if available
    gemini = _init_gemini_client()
    if gemini:
        try:
            candidates_summary = [
                {
                    "issue_id": c[1].get("issue_id"),
                    "title": c[1].get("title"),
                    "category": c[1].get("category"),
                    "description": c[1].get("description"),
                    "distance_meters": round(c[0], 1)
                }
                for c in candidates
            ]
            prompt = f"""
You are the AI Duplicate Detection Engine for CivicLens (an urban civic management system).
Compare this newly submitted civic issue with the existing open issues nearby:

New Issue:
- Title: {title}
- Description: {description}
- Category: {category}

Existing Nearby Open Issues:
{json.dumps(candidates_summary, indent=2)}

Determine if the new issue reports the SAME underlying physical problem as any existing issue.
Return ONLY a valid JSON object formatted as follows:
{{
  "is_duplicate": true or false,
  "confidence": float between 0.0 and 1.0,
  "matched_issue_id": "issue_id or null",
  "rationale": "Concise explanation of similarity or difference"
}}
"""
            response = gemini.generate_content(prompt)
            text = response.text.strip()
            # Extract JSON block if wrapped in markdown
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                result = json.loads(match.group(0))
                matched_id = result.get("matched_issue_id")
                matched_doc = next((c[1] for c in candidates if c[1].get("issue_id") == matched_id), None)
                return {
                    "is_duplicate": result.get("is_duplicate", False),
                    "confidence": float(result.get("confidence", 0.0)),
                    "matched_issue": matched_doc,
                    "potential_matches": [c[1] for c in candidates],
                    "rationale": result.get("rationale", "AI similarity analysis completed.")
                }
        except Exception as e:
            print(f"[AI Service] Gemini duplicate check fallback due to: {e}")

    # 3. Built-in Local Heuristic Fallback (TF-IDF Cosine + Geo proximity)
    best_match = None
    best_score = 0.0
    best_reason = ""

    new_words = set(re.findall(r'\w+', (title + " " + description).lower()))

    for dist, issue in candidates:
        same_cat = issue.get("category", "").lower() == category.lower()
        exist_words = set(re.findall(r'\w+', (issue.get("title", "") + " " + issue.get("description", "")).lower()))
        
        intersection = new_words.intersection(exist_words)
        union = new_words.union(exist_words)
        jaccard = len(intersection) / len(union) if union else 0.0

        # Proximity weight: 1.0 at 0m down to 0.2 at 400m
        dist_factor = max(0.1, 1.0 - (dist / max_distance_meters))
        
        cat_bonus = 0.3 if same_cat else -0.2
        combined_score = (jaccard * 0.5) + (dist_factor * 0.3) + cat_bonus
        combined_score = max(0.0, min(1.0, combined_score))

        if combined_score > best_score:
            best_score = combined_score
            best_match = issue
            best_reason = f"Similar {category} problem reported {int(dist)}m away with {int(jaccard*100)}% descriptive word overlap."

    is_dup = best_score >= 0.55
    return {
        "is_duplicate": is_dup,
        "confidence": round(best_score, 2),
        "matched_issue": best_match if is_dup else None,
        "potential_matches": [c[1] for c in candidates],
        "rationale": best_reason if is_dup else "No sufficiently overlapping reports found."
    }

def predict_issue_priority(
    title: str,
    description: str,
    category: str,
    verification_count: int = 0,
    duplicate_count: int = 0,
    image_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    SRS 4.5: Calculate priority level (Low, Medium, High, Urgent), Priority Score (1-10),
    and Department routing.
    """
    category_dept_map = {
        "Pothole": "Roads & Infrastructure",
        "Damaged Streetlight": "Electrical & Lighting",
        "Garbage Accumulation": "Solid Waste & Sanitation",
        "Water Leakage": "Water Supply & Sewage",
        "Drainage Problem": "Storm Water & Drainage",
        "Traffic Signal Failure": "Traffic & Transportation",
        "Other": "General Administration"
    }

    gemini = _init_gemini_client()
    if gemini:
        try:
            prompt = f"""
You are the AI Prioritization and Routing Engine for CivicLens.
Analyze the following civic issue report:
- Category: {category}
- Title: {title}
- Description: {description}
- Community Verifications: {verification_count}
- Duplicate Reports: {duplicate_count}

Evaluate public safety hazards, traffic disruption, sanitation impact, and urgency.
Return ONLY a valid JSON object:
{{
  "priority": "Low" | "Medium" | "High" | "Urgent",
  "priority_score": float between 1.0 and 10.0,
  "recommended_department": "string",
  "rationale": "1-2 sentence explanation of why this priority and department were assigned"
}}
"""
            response = gemini.generate_content(prompt)
            text = response.text.strip()
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                return {
                    "priority": data.get("priority", "Medium"),
                    "priority_score": float(data.get("priority_score", 5.0)),
                    "recommended_department": data.get("recommended_department", category_dept_map.get(category, "General Administration")),
                    "ai_rationale": data.get("rationale", "AI priority assigned based on hazard assessment.")
                }
        except Exception as e:
            print(f"[AI Service] Gemini priority prediction fallback due to: {e}")

    # Fallback multi-factor scoring (SRS Appendix C TBD-01 formula)
    base_category_scores = {
        "Traffic Signal Failure": 7.5,
        "Water Leakage": 6.5,
        "Drainage Problem": 7.0,
        "Pothole": 5.5,
        "Damaged Streetlight": 5.0,
        "Garbage Accumulation": 4.5,
        "Other": 4.0
    }

    score = base_category_scores.get(category, 5.0)

    # Urgent keywords boost
    text_content = (title + " " + description).lower()
    high_hazard_keywords = ["accident", "danger", "burst", "overflow", "hazard", "blocked", "school", "hospital", "spark", "electric shock", "deep"]
    for kw in high_hazard_keywords:
        if kw in text_content:
            score += 0.8

    # Community verification impact
    score += min(2.0, verification_count * 0.4)

    # Duplicate reports count impact
    score += min(1.5, duplicate_count * 0.5)

    score = round(max(1.0, min(10.0, score)), 1)

    if score >= 8.5:
        priority_label = "Urgent"
    elif score >= 6.5:
        priority_label = "High"
    elif score >= 4.5:
        priority_label = "Medium"
    else:
        priority_label = "Low"

    return {
        "priority": priority_label,
        "priority_score": score,
        "recommended_department": category_dept_map.get(category, "General Administration"),
        "ai_rationale": f"Calculated based on {category} baseline severity, keyword risk indicators, and community signal."
    }

def analyze_issue_image(image_file_path: str) -> Dict[str, Any]:
    """
    Analyze image using Gemini Vision if available.
    """
    gemini = _init_gemini_client()
    if not gemini or not os.path.exists(image_file_path):
        return {
            "success": False,
            "message": "Gemini Vision not configured or image file not found."
        }
    try:
        import PIL.Image
        img = PIL.Image.open(image_file_path)
        prompt = """
Examine this photo taken in an urban environment.
Identify if it depicts a civic problem (such as pothole, garbage dump, street light, water leak, drainage, traffic signal).
Return JSON:
{
  "detected_category": "Pothole" | "Garbage Accumulation" | "Water Leakage" | "Damaged Streetlight" | "Drainage Problem" | "Traffic Signal Failure" | "Other",
  "damage_severity": "Low" | "Medium" | "High" | "Critical",
  "visual_summary": "1 sentence description of what is seen in the image"
}
"""
        response = gemini.generate_content([prompt, img])
        match = re.search(r'\{.*\}', text:=response.text.strip(), re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except Exception as e:
        print(f"[AI Service] Vision analysis error: {e}")
    return {"success": False}
