from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from repositories.announcement_repository import AnnouncementRepository
from services.announcement_service import AnnouncementService
from dependencies import get_current_user_id

router = APIRouter(prefix="/announcements")

class CreateAnnouncementRequest(BaseModel):
    title:     str
    content:   str
    course_id: str

class UpdateAnnouncementRequest(BaseModel):
    title:   str
    content: str

@router.post("")
def create_announcement(
    request: CreateAnnouncementRequest,
    db: Session = Depends(get_db),
    requester_id: str = Depends(get_current_user_id),
):
    service = AnnouncementService(AnnouncementRepository(db))
    try:
        announcement = service.create_announcement(
            title=request.title,
            content=request.content,
            course_id=request.course_id,
            requester_id=requester_id,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    return {"success": True, "data": _serialize(announcement)}

@router.get("/course/{course_id}")
def get_by_course(course_id: str, db: Session = Depends(get_db)):
    service = AnnouncementService(AnnouncementRepository(db))
    announcements = service.get_by_course(course_id)
    return {"success": True, "data": [_serialize(a) for a in announcements]}

@router.get("/{announcement_id}")
def get_detail(announcement_id: str, db: Session = Depends(get_db)):
    service = AnnouncementService(AnnouncementRepository(db))
    try:
        announcement = service.get_by_id(announcement_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"success": True, "data": _serialize(announcement)}

@router.put("/{announcement_id}")
def update_announcement(
    announcement_id: str,
    request: UpdateAnnouncementRequest,
    db: Session = Depends(get_db),
    requester_id: str = Depends(get_current_user_id),
):
    service = AnnouncementService(AnnouncementRepository(db))
    try:
        announcement = service.update_announcement(
            announcement_id=announcement_id,
            title=request.title,
            content=request.content,
            requester_id=requester_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return {"success": True, "data": _serialize(announcement)}

def _serialize(a) -> dict:
    return {
        "announcement_id": str(a.announcement_id),
        "title":           a.title,
        "content":         a.content,
        "created_at":      a.created_at.isoformat(),
        "updated_at":      a.updated_at.isoformat() if a.updated_at else None,
        "created_by":      str(a.created_by),
        "course_id":       str(a.course_id),
    }