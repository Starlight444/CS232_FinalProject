from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from handler.scrapers_handler import router as sync_router
from models import *

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sync_router)

@app.get("/")
def root():
    return {"message": "scraper lambda running"}