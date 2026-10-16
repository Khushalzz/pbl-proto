from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from auth import create_access_token, get_current_user, hash_password, verify_password
from db import get_collection
from models import UserLogin, UserRegister, UserResponse
from services.audit_service import log_audit_event

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
def register(req: UserRegister):
    users_col = get_collection("users")
    if users_col.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    new_user = {
        "email": req.email,
        "password_hash": hash_password(req.password),
        "full_name": req.full_name,
        "phone": req.phone or "",
        "role": req.role,
        "department": req.department,
        "trust_score": 100,
        "created_at": datetime.utcnow().isoformat()
    }
    inserted = users_col.insert_one(new_user)
    token = create_access_token({"sub": inserted["_id"], "email": inserted["email"], "role": inserted["role"]})
    
    log_audit_event(
        action="USER_REGISTRATION",
        user_id=inserted["_id"],
        user_email=inserted["email"],
        user_role=inserted["role"],
        details={"name": inserted["full_name"]}
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": inserted["_id"],
            "email": inserted["email"],
            "full_name": inserted["full_name"],
            "phone": inserted["phone"],
            "role": inserted["role"],
            "department": inserted.get("department"),
            "trust_score": inserted.get("trust_score", 100)
        }
    }

@router.post("/login")
def login(req: UserLogin):
    users_col = get_collection("users")
    user = users_col.find_one({"email": req.email})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        log_audit_event(
            action="FAILED_LOGIN_ATTEMPT",
            user_email=req.email,
            details={"reason": "Invalid credentials"}
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": user["_id"], "email": user["email"], "role": user["role"]})
    
    log_audit_event(
        action="USER_LOGIN",
        user_id=user["_id"],
        user_email=user["email"],
        user_role=user["role"]
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "phone": user.get("phone", ""),
            "role": user["role"],
            "department": user.get("department"),
            "trust_score": user.get("trust_score", 100)
        }
    }

@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "phone": user.get("phone", ""),
        "role": user["role"],
        "department": user.get("department"),
        "trust_score": user.get("trust_score", 100)
    }
