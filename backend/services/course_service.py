from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
from models.course_model import Course
from models.course_member_model import CourseMember
from repositories import course_repository, course_member_repository


def list_courses(db: Session):
    return course_repository.get_all_courses(db)