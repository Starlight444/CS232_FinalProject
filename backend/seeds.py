import uuid
from sqlalchemy.orm import Session
from models.course_model import Course
from models.course_member_model import CourseMember

def seed_data(db: Session):
    if db.query(Course).first(): return
    c1 = Course(course_id=uuid.uuid4(), course_code="CS251", course_name="Database")
    db.add(c1)
    db.flush()
    db.add(CourseMember(role='professor', user_id=uuid.UUID("11111111-1111-1111-1111-111111111111"), course_id=c1.course_id))
    db.commit()
    print("Seed complete!")