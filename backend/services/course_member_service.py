from sqlalchemy.orm import Session
import uuid
from models.course_member_model import CourseMember
from repositories import course_member_repository

def enroll_student(db: Session, course_id: uuid.UUID, user_id: uuid.UUID):
    new_member = CourseMember(role='student', user_id=user_id, course_id=course_id)
    course_member_repository.add_member(db, new_member)
    db.commit()
    return new_member

def get_students(db: Session, course_id: uuid.UUID):
    return course_member_repository.get_members_by_course(db, course_id)