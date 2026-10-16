import uuid
from datetime import datetime, timedelta
from auth import hash_password
from db import get_collection

def seed_database():
    users_col = get_collection("users")
    issues_col = get_collection("issues")
    depts_col = get_collection("departments")
    verifications_col = get_collection("verifications")
    audit_col = get_collection("audit_logs")
    notifications_col = get_collection("notifications")

    # Only seed if users collection is empty
    if users_col.count_documents() > 0:
        print("[Seeder] Database already populated. Skipping seed.")
        return

    print("[Seeder] Populating database with local test accounts, departments, and Pune civic issues...")

    # 1. Departments
    departments = [
        {
            "_id": "dept-roads",
            "name": "Roads & Infrastructure",
            "code": "PMC-RD",
            "head_name": "",
            "contact_email": "roads@pune.gov.in",
            "categories": ["Pothole", "Damaged Footpath", "Road Cave-in"]
        },
        {
            "_id": "dept-sanitation",
            "name": "Solid Waste & Sanitation",
            "code": "PMC-SWM",
            "head_name": "",
            "contact_email": "sanitation@pune.gov.in",
            "categories": ["Garbage Accumulation", "Uncleaned Bins", "Debris Dumping"]
        },
        {
            "_id": "dept-water",
            "name": "Water Supply & Sewage",
            "code": "PMC-WTR",
            "head_name": "",
            "contact_email": "water@pune.gov.in",
            "categories": ["Water Leakage", "Pipeline Burst", "Low Water Pressure"]
        },
        {
            "_id": "dept-electrical",
            "name": "Electrical & Lighting",
            "code": "PMC-ELEC",
            "head_name": "",
            "contact_email": "electrical@pune.gov.in",
            "categories": ["Damaged Streetlight", "Exposed Electric Cable", "Flickering Light"]
        },
        {
            "_id": "dept-drainage",
            "name": "Storm Water & Drainage",
            "code": "PMC-DRN",
            "head_name": "",
            "contact_email": "drainage@pune.gov.in",
            "categories": ["Drainage Problem", "Manhole Cover Missing", "Waterlogging"]
        },
        {
            "_id": "dept-traffic",
            "name": "Traffic & Transportation",
            "code": "PMC-TRF",
            "head_name": "",
            "contact_email": "traffic@pune.gov.in",
            "categories": ["Traffic Signal Failure", "Missing Signboard", "Speedbreaker Damaged"]
        }
    ]
    for d in departments:
        depts_col.insert_one(d)

    # 2. Local Test Users
    now_iso = datetime.utcnow().isoformat()
    test_users = [
        {
            "_id": "user-citizen-1",
            "email": "citizen@civiclens.gov",
            "password_hash": hash_password("citizen123"),
            "full_name": "",
            "phone": "",
            "role": "Citizen",
            "department": None,
            "trust_score": 100,
            "created_at": now_iso
        },
        {
            "_id": "user-officer-1",
            "email": "officer@civiclens.gov",
            "password_hash": hash_password("officer123"),
            "full_name": "",
            "phone": "",
            "role": "Municipal Officer",
            "department": "Roads & Infrastructure",
            "trust_score": 100,
            "created_at": now_iso
        },
        {
            "_id": "user-engineer-1",
            "email": "engineer@civiclens.gov",
            "password_hash": hash_password("engineer123"),
            "full_name": "",
            "phone": "",
            "role": "Field Engineer",
            "department": "Roads & Infrastructure",
            "trust_score": 100,
            "created_at": now_iso
        },
        {
            "_id": "user-admin-1",
            "email": "admin@civiclens.gov",
            "password_hash": hash_password("admin123"),
            "full_name": "",
            "phone": "",
            "role": "Administrator",
            "department": "Municipal IT & Operations",
            "trust_score": 100,
            "created_at": now_iso
        }
    ]
    for u in test_users:
        users_col.insert_one(u)

    # 3. Realistic Pune Civic Issues
    issues = [
        {
            "_id": "issue-001",
            "issue_id": "CL-2026-001",
            "title": "Severe Pothole Cluster near MIT WPU Main Gate",
            "description": "Deep multiple potholes spanning the lane right outside the MIT WPU gate on Paud Road causing two-wheelers to skid and heavy traffic slowdown.",
            "category": "Pothole",
            "location": {
                "latitude": 18.5178,
                "longitude": 73.8155,
                "address": "Opposite MIT WPU Gate 2, Paud Road, Kothrud, Pune",
                "ward": "Kothrud Ward 12"
            },
            "image_urls": ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80"],
            "reporter_id": "user-citizen-1",
            "reporter_name": "",
            "reporter_email": "citizen@civiclens.gov",
            "status": "In Progress",
            "priority": "High",
            "ai_analysis": {
                "duplicate_checked": True,
                "predicted_priority": "High",
                "priority_score": 7.8,
                "recommended_department": "Roads & Infrastructure",
                "ai_rationale": "High traffic university access road with student pedestrian footfall and skidding hazard."
            },
            "assigned_department": "Roads & Infrastructure",
            "assigned_engineer_id": "user-engineer-1",
            "assigned_engineer_name": "",
            "verification_count": 8,
            "credibility_score": 96.0,
            "status_history": [
                {"status": "Reported", "updated_by": "Citizen", "timestamp": (datetime.utcnow() - timedelta(days=2)).isoformat(), "comment": "Issue logged via Citizen Portal with location photo."},
                {"status": "Assigned", "updated_by": "Municipal Officer", "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat(), "comment": "Field engineer assigned for urgent cold-mix asphalt patch work."},
                {"status": "In Progress", "updated_by": "Field Operations", "timestamp": (datetime.utcnow() - timedelta(hours=4)).isoformat(), "comment": "Road repair team on site. Barricades set up, asphalt patching underway."}
            ],
            "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
            "updated_at": (datetime.utcnow() - timedelta(hours=4)).isoformat()
        },
        {
            "_id": "issue-002",
            "issue_id": "CL-2026-002",
            "title": "Overflowing Community Garbage Bin at Ideal Colony",
            "description": "Garbage has not been collected for three days. Overflowing on the sidewalk causing stray dog gathering and terrible odor near residential apartments.",
            "category": "Garbage Accumulation",
            "location": {
                "latitude": 18.5132,
                "longitude": 73.8130,
                "address": "Lane 4, Ideal Colony, Kothrud, Pune",
                "ward": "Kothrud Ward 12"
            },
            "image_urls": ["https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80"],
            "reporter_id": "user-citizen-1",
            "reporter_name": "",
            "reporter_email": "citizen@civiclens.gov",
            "status": "Reported",
            "priority": "Medium",
            "ai_analysis": {
                "duplicate_checked": True,
                "predicted_priority": "Medium",
                "priority_score": 5.4,
                "recommended_department": "Solid Waste & Sanitation",
                "ai_rationale": "Public health hazard and pedestrian blockage in high-density residential zone."
            },
            "assigned_department": "Solid Waste & Sanitation",
            "assigned_engineer_id": None,
            "assigned_engineer_name": None,
            "verification_count": 5,
            "credibility_score": 88.0,
            "status_history": [
                {"status": "Reported", "updated_by": "Citizen", "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat(), "comment": "Complaint filed with geolocation."}
            ],
            "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "updated_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
        },
        {
            "_id": "issue-003",
            "issue_id": "CL-2026-003",
            "title": "Main Pipeline Water Gushing on Karve Road",
            "description": "Severe potable water pipeline fracture under the walkway. Clean drinking water continuously gushing onto the street, flooding the bus stop.",
            "category": "Water Leakage",
            "location": {
                "latitude": 18.5020,
                "longitude": 73.8210,
                "address": "Near Karve Statue Bus Stop, Karve Road, Pune",
                "ward": "Erandwane Ward 14"
            },
            "image_urls": ["https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80"],
            "reporter_id": "user-citizen-1",
            "reporter_name": "",
            "reporter_email": "citizen@civiclens.gov",
            "status": "Reported",
            "priority": "Urgent",
            "ai_analysis": {
                "duplicate_checked": True,
                "predicted_priority": "Urgent",
                "priority_score": 9.2,
                "recommended_department": "Water Supply & Sewage",
                "ai_rationale": "Major water wastage and structural erosion hazard near public transit point."
            },
            "assigned_department": None,
            "assigned_engineer_id": None,
            "assigned_engineer_name": None,
            "verification_count": 12,
            "credibility_score": 99.0,
            "status_history": [
                {"status": "Reported", "updated_by": "Citizen", "timestamp": (datetime.utcnow() - timedelta(hours=8)).isoformat(), "comment": "Urgent alert submitted by local commuter."}
            ],
            "created_at": (datetime.utcnow() - timedelta(hours=8)).isoformat(),
            "updated_at": (datetime.utcnow() - timedelta(hours=8)).isoformat()
        },
        {
            "_id": "issue-004",
            "issue_id": "CL-2026-004",
            "title": "Damaged Streetlight Pole with Exposed Wires",
            "description": "Street pole tilted after vehicle impact with loose wires exposed close to ground level. High risk during evening hours.",
            "category": "Damaged Streetlight",
            "location": {
                "latitude": 18.5080,
                "longitude": 73.8040,
                "address": "Near Vanaz Metro Station, Paud Road, Pune",
                "ward": "Kothrud Ward 12"
            },
            "image_urls": ["https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80"],
            "reporter_id": "user-citizen-1",
            "reporter_name": "",
            "reporter_email": "citizen@civiclens.gov",
            "status": "Resolved",
            "priority": "Urgent",
            "ai_analysis": {
                "duplicate_checked": True,
                "predicted_priority": "Urgent",
                "priority_score": 8.9,
                "recommended_department": "Electrical & Lighting",
                "ai_rationale": "Direct electrocution risk to pedestrians and metro commuters."
            },
            "assigned_department": "Electrical & Lighting",
            "assigned_engineer_id": "user-engineer-1",
            "assigned_engineer_name": "",
            "verification_count": 9,
            "credibility_score": 98.0,
            "status_history": [
                {"status": "Reported", "updated_by": "Citizen", "timestamp": (datetime.utcnow() - timedelta(days=3)).isoformat(), "comment": "Citizen reported exposed live wiring."},
                {"status": "Assigned", "updated_by": "Municipal Officer", "timestamp": (datetime.utcnow() - timedelta(days=2)).isoformat(), "comment": "Assigned for emergency electrical repair."},
                {"status": "In Progress", "updated_by": "Field Operations", "timestamp": (datetime.utcnow() - timedelta(days=2, hours=-3)).isoformat(), "comment": "Power isolated, replacement pole installed."},
                {"status": "Resolved", "updated_by": "Field Operations", "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat(), "comment": "Completed. Wiring secured in grounded junction box and tested."}
            ],
            "resolution": {
                "resolved_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "completion_notes": "Pole straightened, brand new LED lamp fitted, and wiring completely insulated and sealed.",
                "evidence_image_url": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80",
                "resolved_by": "Field Operations"
            },
            "created_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
            "updated_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
        },
        {
            "_id": "issue-005",
            "issue_id": "CL-2026-005",
            "title": "Traffic Signal Blinking Red at Chandani Chowk Junction",
            "description": "Traffic lights stuck on blinking mode causing severe gridlock and near-miss vehicle collisions at the busy highway junction.",
            "category": "Traffic Signal Failure",
            "location": {
                "latitude": 18.5074,
                "longitude": 73.7842,
                "address": "Chandani Chowk Flyover Junction, Pune",
                "ward": "Bavdhan Ward 10"
            },
            "image_urls": ["https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80"],
            "reporter_id": "user-citizen-1",
            "reporter_name": "",
            "reporter_email": "citizen@civiclens.gov",
            "status": "Reported",
            "priority": "High",
            "ai_analysis": {
                "duplicate_checked": True,
                "predicted_priority": "High",
                "priority_score": 8.1,
                "recommended_department": "Traffic & Transportation",
                "ai_rationale": "High-volume intersection malfunction causing vehicle collision hazard."
            },
            "assigned_department": "Traffic & Transportation",
            "assigned_engineer_id": None,
            "assigned_engineer_name": None,
            "verification_count": 6,
            "credibility_score": 92.0,
            "status_history": [
                {"status": "Reported", "updated_by": "Citizen", "timestamp": (datetime.utcnow() - timedelta(hours=3)).isoformat(), "comment": "Reported by vehicle driver."}
            ],
            "created_at": (datetime.utcnow() - timedelta(hours=3)).isoformat(),
            "updated_at": (datetime.utcnow() - timedelta(hours=3)).isoformat()
        }
    ]

    for iss in issues:
        issues_col.insert_one(iss)

    # 4. Sample Verifications
    verifications = [
        {"_id": str(uuid.uuid4()), "issue_id": "issue-001", "citizen_id": "user-citizen-1", "citizen_name": "", "comment": "I ride this road every day for college, it's very dangerous.", "verified_at": now_iso},
        {"_id": str(uuid.uuid4()), "issue_id": "issue-003", "citizen_id": "user-citizen-1", "citizen_name": "", "comment": "Water is entering nearby shops now.", "verified_at": now_iso}
    ]
    for v in verifications:
        verifications_col.insert_one(v)

    # 5. Audit Log sample
    audit_col.insert_one({
        "timestamp": now_iso,
        "action": "SYSTEM_INITIALIZATION",
        "user_id": "system",
        "user_email": "system@civiclens.gov",
        "user_role": "System",
        "details": {"message": "Database successfully initialized with Pune seed data.", "version": "1.0"},
        "ip_address": "127.0.0.1"
    })

    # 6. Notifications sample
    notifications_col.insert_one({
        "recipient_id": "user-citizen-1",
        "recipient_email": "citizen@civiclens.gov",
        "title": "Issue Under Repair",
        "message": "Your reported issue CL-2026-001 (Pothole at MIT WPU) has been taken up by Field Operations.",
        "type": "status_change",
        "read": False,
        "created_at": now_iso,
        "link": "/issues/issue-001"
    })

    print("[Seeder] Successfully seeded local test users, departments, and Pune civic issues.")
