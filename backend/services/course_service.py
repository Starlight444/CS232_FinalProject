import uuid
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.course_model import Course, CourseCreate
from models.course_member_model import CourseMember
from repositories import course_repository, course_member_repository

def create_course_with_owner(db: Session, course_data: CourseCreate, user_id: uuid.UUID):
    # 1. เช็คว่ามีรหัสวิชาซ้ำไหม
    if course_repository.get_course_by_code(db, course_data.course_code):
        raise HTTPException(status_code=400, detail="Course code already exists")

    try:
        # 2. สร้างคอร์ส
        new_course = Course(
            course_code=course_data.course_code,
            course_name=course_data.course_name,
            description=course_data.description
        )
        course_repository.create_course(db, new_course)

        # 3. เพิ่มคนสร้างเป็น Professor ทันที
        new_member = CourseMember(
            role='professor',
            user_id=user_id,
            course_id=new_course.course_id
        )
        course_member_repository.add_member(db, new_member)

        # 4. ยืนยันข้อมูลลงทั้ง 2 ตาราง
        db.commit()
        db.refresh(new_course)
        return new_course
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

def list_all_courses(db: Session):
    return course_repository.get_all_courses(db)