from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.course_model import CourseResponse
from services.course_service import CourseService

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[CourseResponse])
def get_all_courses(db: Session = Depends(get_db)):
    course_service = CourseService(db)
    return course_service.list_courses()


@router.get("/my/{user_id}", response_model=list[CourseResponse])
def get_my_courses(
    user_id: str,
    role: str = Query(default=None, description="student, teacher, ta"),
    db: Session = Depends(get_db)
):
    course_service = CourseService(db)
    return course_service.list_courses_by_user(user_id, role)

@router.get("/courses/{course_id}/with-assignments")
def get_course_with_assignments(course_id: str, db=Depends(get_db)):
    return CourseService(db).get_course_with_assignments(course_id)