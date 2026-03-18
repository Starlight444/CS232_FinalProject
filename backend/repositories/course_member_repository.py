from sqlalchemy.orm import Session
from models.course_member_model import CourseMember
import uuid

def add_member(db: Session, member_obj: CourseMember):
    db.add(member_obj)
    db.flush()
    return member_obj

def get_members_by_course(db: Session, course_id: uuid.UUID):
    return db.query(CourseMember).filter(CourseMember.course_id == course_id).all()