from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
from models.course_model import Course, CourseCreate
from models.course_member_model import CourseMember
from repositories import course_repository, course_member_repository

def create_course_with_owner(db: Session, course_data: CourseCreate, user_id: uuid.UUID):
    if course_repository.get_course_by_code(db, course_data.course_code):
        raise HTTPException(status_code=400, detail="Course code already exists")
    try:
        new_course = Course(**course_data.model_dump())
        course_repository.create_course(db, new_course)
        
        # เพิ่มคนสร้างเป็น Professor
        owner = CourseMember(role='professor', user_id=user_id, course_id=new_course.course_id)
        course_member_repository.add_member(db, owner)
        
        db.commit()
        db.refresh(new_course)
        return new_course
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

def list_courses(db: Session):
    return course_repository.get_all_courses(db)