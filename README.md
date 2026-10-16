# CivicLens: AI-Powered Community-Based Urban Issue Reporting and Intelligent Prioritization System

CivicLens is an intelligent civic issue management platform developed in accordance with the IEEE Software Requirements Specification (Karl E. Wiegers structure) and the COCOMO II Object Point Estimation specifications.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |       React + TypeScript Frontend     |
                      |   (Vite, Tailwind CSS, Leaflet Maps)  |
                      +---------------------------------------+
                                          |
                                    REST / HTTPS
                                          |
                      +---------------------------------------+
                      |         FastAPI Backend (Python)      |
                      |  (JWT Auth, RBAC, AI Services, Uvicorn)
                      +---------------------------------------+
                           /              |              \
                          /               |               \
        +-------------------+    +-----------------+    +-------------------+
        |    Persistence    |    |    AI Engine    |    |  External / Media |
        |  MongoDB / Mongo- |    |  Google Gemini  |    |  Local Static /   |
        |  Atlas & Embedded |    |  (Vision, NLP & |    |  Cloudinary &     |
        |  Document Store   |    |  Geo-Spatial)   |    |  In-App SMTP Log  |
        +-------------------+    +-----------------+    +-------------------+
```

---

## 10 Screens Implemented (COCOMO II Specification)

| Screen No. | Screen Name | Complexity | Description & Features |
|:---:|:---|:---:|:---|
| **1** | **Login** | Simple | JWT authentication, validation, and error alerts. |
| **2** | **Registration** | Simple | Stakeholder registration with email, phone, and role-based assignments. |
| **3** | **Citizen Dashboard** | Medium | Urban metrics, interactive Pune infrastructure map, quick report triggers, and filtered issue feeds. |
| **4** | **Report Issue** | Medium | Interactive Leaflet pin picker, GPS "Locate Me", photo evidence uploader, and **Live AI Duplicate Warning Modal**. |
| **5** | **Issue Details & Tracking** | Medium | Full timeline progress, citizen photo evidence, Gemini AI Diagnostics panel, and post-repair field certification proof. |
| **6** | **Community Verification** | Medium | Neighborhood issue exploration, citizen consensus upvotes, and Trust Engine score adjustments. |
| **7** | **Officer Dashboard** | Difficult | Priority triage queue, AI recommendation evaluation, department routing, and status filters. |
| **8** | **Team Assignment** | Simple | Officer assignment modal for dispatching tasks to municipal departments and field engineers with notes. |
| **9** | **Field Engineer Resolution**| Difficult | Field operations portal, on-site status transitions (In Progress / Resolved), completion notes, and post-repair proof photo upload. |
| **10**| **Analytics & Admin Dashboard**| Simple | GIS Heatmap with intensity layers, category/ward distribution, user role management, and audit trail. |

---

## 4 Local Test Profiles (SRS Section 2.3)

Use these seeded accounts through the standard email and password sign-in form. They are for local testing only.

| Profile | Email | Password |
|:---|:---|:---|
| Citizen | `citizen@civiclens.gov` | `citizen123` |
| Municipal Officer | `officer@civiclens.gov` | `officer123` |
| Field Engineer | `engineer@civiclens.gov` | `engineer123` |
| Administrator | `admin@civiclens.gov` | `admin123` |

The backend seeds these accounts when its local data store is empty.

1. **Citizen:**
   - Report urban issues with photos & GPS coordinates.
   - Live AI duplicate warnings prevent redundant reports.
   - Verify/upvote neighborhood issues to boost priority and credibility score.
   - Real-time status notifications.
2. **Municipal Officer:**
   - Review incoming reports from citizens.
   - Inspect AI priority predictions and override urgency if needed.
   - Route complaints to responsible municipal departments and field engineers.
3. **Field Engineer:**
   - Access assigned field work orders.
   - Update job statuses on site (*In Progress*, *Resolved*).
   - Upload post-repair photo evidence and completion reports.
4. **Administrator:**
   - GIS Heatmap monitoring spatial concentrations of infrastructure issues.
   - Performance SLA metrics and category breakdown.
   - Role and department management.
   - Audit logs tracking every action.

---

---

## Notification & Email Logging System

- **In-App Notification Center:** Click the Bell icon in the header to view real-time notifications with unread badges.
- **Simulated Email Dispatcher:** Click the **Email Logs** button in the header to view outgoing simulated SMTP emails generated when reports are submitted, assigned, or resolved.

---

## Running the Application Locally

### 1. Backend Server (`FastAPI`)
```powershell
cd backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Edit .env and set JWT_SECRET to a unique random value.
python -m pip install -r ../requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### 2. Frontend Development Server (`Vite + React`)
```powershell
cd frontend
npm run dev
```
- Web Application URL: `http://localhost:5173`
