import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.course_member_model import MemberResponse
from services import course_member_service

router = APIRouter(prefix="/members", tags=["Members"])
MOCK_STUDENT_ID = uuid.UUID("88888888-8888-8888-8888-888888888888") # เดะค่อยเพิ่มนร.คับพี่

@router.get("/{course_id}", response_model=list[MemberResponse])
def get_list(course_id: uuid.UUID, db: Session = Depends(get_db)):
    return course_member_service.get_students(db, course_id)