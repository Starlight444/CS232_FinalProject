import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.course_model import CourseResponse
from services import course_service

router = APIRouter(prefix="/courses", tags=["Courses"]) 


MOCK_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111") # Mock user ID ของจาร

@router.get("/", response_model=list[CourseResponse])
def get_all(db: Session = Depends(get_db)):
    """ดึงรายชื่อคอร์สทั้งหมดที่มีในระบบ (Mock มาจาก seeds.py)"""
    return course_service.list_courses(db)

