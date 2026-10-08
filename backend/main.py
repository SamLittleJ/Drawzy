import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import database, models
from backend.routers import chat, drawings, rooms, rounds, users, votes, ws
from backend.seed import seed_themes


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=database.engine)
    with database.SessionLocal() as db:
        seed_themes(db)
    yield


app = FastAPI(title="Drawzy API", version="1.0.0", lifespan=lifespan)

# Comma-separated list of allowed origins, e.g. "http://localhost:3000,https://drawzy.example.com".
cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (users, rooms, rounds, drawings, chat, votes, ws):
    app.include_router(module.router)


@app.get("/", tags=["Meta"])
def read_root():
    return {"name": "Drawzy API", "docs": "/docs"}


@app.get("/health", tags=["Meta"])
def health_check():
    return {"status": "ok"}
