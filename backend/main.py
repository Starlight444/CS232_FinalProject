from fastapi import FastAPI
from database import engine, Base, SessionLocal
from handlers import course_handler, course_member_handler
from seeds import seed_data

Base.metadata.create_all(bind=engine)
db = SessionLocal()
seed_data(db)
db.close()

app = FastAPI()
app.include_router(course_handler.router)
app.include_router(course_member_handler.router)