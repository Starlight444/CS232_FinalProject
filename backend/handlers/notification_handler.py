from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user_id

from repositories.assignment_repository import AssignmentRepository
from repositories.course_member_repository import CourseMemberRepository
from repositories.course_repository import CourseRepository
from repositories.external_assignment_repository import ExternalAssignmentRepository

from services.assignment_service import AssignmentService
from services.notification_service import NotificationService

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"]
)

@router.get("/check-deadlines")
def check_deadlines(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):

    repo = AssignmentRepository(db)

    member_repo = CourseMemberRepository(db)

    assignment_service = AssignmentService(
        repo,
        member_repo
    )

    notification_service = NotificationService(
        assignment_service
    )

    course_repo = CourseRepository(db)

    external_repo = ExternalAssignmentRepository(db)

    notification_service.check_deadlines(
        user_id=user_id,
        course_repo=course_repo,
        external_repo=external_repo
    )

    return {
        "success": True,
        "message": "Deadline notifications sent"
    }