from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.course_member_model import MemberResponse
from services.course_member_service import CourseMemberService

router = APIRouter(prefix="/members", tags=["course_members"])


@router.get("/{course_id}", response_model=list[MemberResponse])
def get_members_by_course(course_id: str, db: Session = Depends(get_db)):
    course_member_service = CourseMemberService(db)
    return course_member_service.get_members_by_course(course_id)


@router.get("/user/{user_id}", response_model=list[MemberResponse])
def get_memberships_by_user(
    user_id: str,
    role: str = Query(default=None, description="student, teacher, ta"),
    db: Session = Depends(get_db)
):
    course_member_service = CourseMemberService(db)
    return course_member_service.get_memberships_by_user(user_id, role)