import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.course_model import CourseCreate, CourseResponse
from services import course_service

router = APIRouter(prefix="/courses", tags=["Courses"])

# Mock User ID สำหรับคนที่กำลังใช้งานระบบ (สมมติว่าเป็น ID ของอาจารย์)
MOCK_CURRENT_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")

@router.get("/", response_model=List[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    """ดึงรายชื่อคอร์สทั้งหมด"""
    return course_service.list_all_courses(db)

@router.post("/", response_model=CourseResponse, status_code=201)
def create_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    """สร้างคอร์สใหม่ และตั้งเราเป็น Professor อัตโนมัติ"""
    return course_service.create_course_with_owner(db, course_in, MOCK_CURRENT_USER_ID)