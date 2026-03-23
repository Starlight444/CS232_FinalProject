import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.course_member_model import MemberResponse
from models.course_member_model import StudentResponse
from services.course_member_service import CourseMemberService

router = APIRouter(prefix="/members", tags=["Members"])

@router.get("/{course_id}/members", response_model=list[MemberResponse])
def get_members(course_id: uuid.UUID, db: Session = Depends(get_db)):
    return CourseMemberService(db).get_members(course_id)

@router.get("/{course_id}/students", response_model=list[StudentResponse])
def get_students(course_id: uuid.UUID, db: Session = Depends(get_db)):
    return CourseMemberService(db).get_students(course_id)