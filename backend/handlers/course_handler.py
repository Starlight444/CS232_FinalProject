from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.course_model import CourseResponse
from services.course_service import CourseService

router = APIRouter(prefix="/courses", tags=["courses"])

course_service = CourseService()


@router.get("/", response_model=list[CourseResponse])
def get_all_courses(db: Session = Depends(get_db)):
    return course_service.list_courses(db)


@router.get("/my/{user_id}", response_model=list[CourseResponse])
def get_my_courses(
    user_id: str,
    role: str = Query(default=None, description="student, teacher, ta"),
    db: Session = Depends(get_db)
):
    return course_service.list_courses_by_user(db, user_id, role)