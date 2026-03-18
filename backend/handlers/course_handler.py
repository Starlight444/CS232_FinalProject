from fastapi import APIRouter
from models.course_model import CourseCreate
from services.course_service import list_courses, add_course

router = APIRouter()


@router.get("/courses")
def get_courses(user_id: str):
    return list_courses(user_id)


@router.post("/courses")
def create_course_handler(course: CourseCreate):
    return add_course(
        course.course_code,
        course.course_name,
        course.description
    )