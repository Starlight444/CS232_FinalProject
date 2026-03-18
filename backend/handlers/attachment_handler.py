from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db

from repositories.attachment_repository import AttachmentRepository
from services.attachment_service import AttachmentService
from storage.s3_storage import S3Storage


router = APIRouter(prefix="/attachments")


@router.post("/assignment/{assignment_id}")
async def upload_assignment_attachment(
    assignment_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    repo = AttachmentRepository(db)
    storage = S3Storage()

    service = AttachmentService(repo, storage)

    attachment = service.upload_assignment_file(
        assignment_id,
        file
    )

    return {
        "success": True,
        "data": attachment
    }


@router.post("/submission/{submission_id}")
async def upload_submission_attachment(
    submission_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    repo = AttachmentRepository(db)
    storage = S3Storage()

    service = AttachmentService(repo, storage)

    attachment = service.upload_submission_file(
        submission_id,
        file
    )

    return {
        "success": True,
        "data": attachment
    }


@router.get("/assignment/{assignment_id}")
def get_assignment_attachments(
    assignment_id: UUID,
    db: Session = Depends(get_db)
):

    repo = AttachmentRepository(db)
    service = AttachmentService(repo, None)

    files = service.get_assignment_files(assignment_id)

    return {
        "success": True,
        "data": files
    }


@router.get("/submission/{submission_id}")
def get_submission_attachments(
    submission_id: UUID,
    db: Session = Depends(get_db)
):

    repo = AttachmentRepository(db)
    service = AttachmentService(repo, None)

    files = service.get_submission_files(submission_id)

    return {
        "success": True,
        "data": files
    }