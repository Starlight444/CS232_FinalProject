import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.course_model import CourseCreate, CourseResponse
from services import course_service

router = APIRouter(prefix="/courses", tags=["Courses"])
MOCK_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111") # สมมติเป็น user ID ของเจ้าของคอร์ส

@router.get("/", response_model=list[CourseResponse])
def get_all(db: Session = Depends(get_db)):
    return course_service.list_courses(db)

@router.post("/", response_model=CourseResponse)
def create(data: CourseCreate, db: Session = Depends(get_db)):
    return course_service.create_course_with_owner(db, data, MOCK_USER_ID)