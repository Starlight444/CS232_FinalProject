from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from handlers.submission_handler import router as submission_router
from handlers.assignment_handler import router as assignment_router
from handlers.attachment_handler import router as attachment_router
from handlers.user_handler import router as user_router
from handlers.course_handler import router as course_router
from handlers.course_member_handler import router as course_member_router
from handlers.announcement_handler import router as announcement_router
from handlers.notification_handler import router as notification_router


app = FastAPI(root_path="/default")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API working"}

app.include_router(submission_router)
app.include_router(assignment_router)
app.include_router(attachment_router)
app.include_router(user_router)
app.include_router(course_router)
app.include_router(course_member_router)
app.include_router(announcement_router)
app.include_router(notification_router)

handler = Mangum(app)