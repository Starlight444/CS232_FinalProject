from fastapi import APIRouter, UploadFile, File, Depends, Form
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db

from repositories.submission_repository import SubmissionRepository
from repositories.course_member_repository import CourseMemberRepository
from repositories.attachment_repository import AttachmentRepository

from services.submission_service import SubmissionService

#from storage.s3_storage import S3Storage


router = APIRouter(prefix="/submissions")


@router.post("/")
async def submit_assignment(
    assignment_id: UUID = Form(...),
    course_id: UUID = Form(...),
    student_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    repo = SubmissionRepository(db)
    member_repo = CourseMemberRepository(db)
    attachment_repo = AttachmentRepository(db)

    #storage = S3Storage()
    storage = None

    service = SubmissionService(repo, member_repo, attachment_repo, storage)

    result = service.submit_assignment(
        assignment_id,
        student_id,
        course_id,
        file
    )

    return {
        "success": True,
        "data": result
    }


@router.patch("/{submission_id}/grade")
def grade_submission(
    submission_id: UUID,
    grader_id: UUID,
    course_id: UUID,
    score: int,
    feedback: str,
    db: Session = Depends(get_db)
):

    repo = SubmissionRepository(db)
    member_repo = CourseMemberRepository(db)

    service = SubmissionService(repo, member_repo, None, None)

    result = service.grade_submission(submission_id,grader_id,course_id, score, feedback)

    return {
        "success": True,
        "data": result
    }