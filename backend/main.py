from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from mangum import Mangum
from sqlalchemy import text

from handlers.submission_handler import router as submission_router
from handlers.assignment_handler import router as assignment_router
from handlers.attachment_handler import router as attachment_router
from handlers.user_handler import router as user_router
from handlers.course_handler import router as course_router
from handlers.course_member_handler import router as course_member_router
from handlers.announcement_handler import router as announcement_router

from database import engine


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def add_missing_columns():
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP"
        ))
        conn.commit()
        
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

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(submission_router)
app.include_router(assignment_router)
app.include_router(attachment_router)
app.include_router(user_router)
app.include_router(course_router)
app.include_router(course_member_router)
app.include_router(announcement_router)

handler = Mangum(app, lifespan="off", api_gateway_base_path="/default")