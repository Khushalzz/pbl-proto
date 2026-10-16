from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = ""
    role: str = "Citizen"  # "Citizen", "Municipal Officer", "Field Engineer", "Administrator"
    department: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = ""
    role: str
    department: Optional[str] = None
    trust_score: int = 100
    created_at: str

class LocationInput(BaseModel):
    latitude: float
    longitude: float
    address: str
    ward: Optional[str] = "Kothrud Ward"

class IssueCreate(BaseModel):
    title: str
    description: str
    category: str
    location: LocationInput
    image_urls: List[str] = []

class DuplicateCheckRequest(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float

class VerificationCreate(BaseModel):
    comment: Optional[str] = ""

class OfficerAssignRequest(BaseModel):
    department: str
    field_engineer_id: Optional[str] = None
    priority: Optional[str] = None
    officer_notes: Optional[str] = ""

class EngineerResolutionRequest(BaseModel):
    status: str = "Resolved"  # "In Progress", "Resolved"
    completion_notes: str
    evidence_image_url: Optional[str] = ""

class NotificationResponse(BaseModel):
    id: str
    recipient_id: str
    title: str
    message: str
    type: str
    read: bool
    created_at: str
    link: Optional[str] = None

class AuditLogEntry(BaseModel):
    action: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    details: Dict[str, Any] = {}
