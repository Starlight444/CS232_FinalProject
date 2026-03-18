import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.course_member_model import MemberResponse, JoinRequest
from services import course_member_service

router = APIRouter(prefix="/members", tags=["Members"])
MOCK_STUDENT_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")

@router.post("/join", response_model=MemberResponse)
def join(req: JoinRequest, db: Session = Depends(get_db)):
    return course_member_service.enroll_student(db, req.course_id, MOCK_STUDENT_ID)

@router.get("/{course_id}", response_model=list[MemberResponse])
def get_list(course_id: uuid.UUID, db: Session = Depends(get_db)):
    return course_member_service.get_students(db, course_id)