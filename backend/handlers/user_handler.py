from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from repositories.user_repository import UserRepository
from services.user_service import UserService

router = APIRouter(prefix="/users")

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    repo = UserRepository(db)
    service = UserService(repo)
    
    user, role, token = service.login(request.email, request.password) 

    return {
        "success": True,
        "data": {
            "token": token,          
            "user_id": user.user_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "student_id": user.student_id,
            "teacher_id": user.teacher_id,
            "role": role
        }
    }

@router.get("/{user_id}")
def get_user(
    user_id: str,
    db: Session = Depends(get_db)
):
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }

    return {
        "success": True,
        "data": {
            "user_id": str(user.user_id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": f"{user.first_name} {user.last_name}"
        }
    }