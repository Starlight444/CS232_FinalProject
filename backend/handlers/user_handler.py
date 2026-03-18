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
    
    user, token = service.login(request.email, request.password)  # unpack tuple
    
    return {
        "success": True,
        "data": {
            "token": token,           # ส่ง token กลับไปให้ frontend เก็บ
            "user_id": user.user_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    }