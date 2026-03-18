from sqlalchemy.orm import Session
import uuid
from models.course_member_model import CourseMember
from repositories import course_member_repository

def get_students(db: Session, course_id: uuid.UUID):
    return course_member_repository.get_members_by_course(db, course_id)