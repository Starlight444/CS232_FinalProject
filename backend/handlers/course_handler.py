import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.course_model import CourseResponse
from services.course_service import CourseService

router = APIRouter(prefix="/courses", tags=["Courses"]) 

@router.get("/", response_model=list[CourseResponse])
def get_all(db: Session = Depends(get_db)):

    service = CourseService(db)
    service.list_courses()
    return CourseService(db).list_courses()
