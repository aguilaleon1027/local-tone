from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from routers import hanbok, fitting, booking
from config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hanbok.router, prefix="/api/hanbok", tags=["한복 카탈로그"])
app.include_router(fitting.router, prefix="/api/fitting", tags=["AI 가상 피팅"])
app.include_router(booking.router, prefix="/api/booking", tags=["예약"])

@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}

DIST_DIR = settings.STATIC_DIR / "dist"

# React dist assets (/assets/xxx.js, /assets/xxx.css)
_dist_assets = DIST_DIR / "assets"
if _dist_assets.exists():
    app.mount("/assets", StaticFiles(directory=str(_dist_assets)), name="dist-assets")

# Legacy static files
app.mount("/static", StaticFiles(directory=str(settings.STATIC_DIR)), name="static")

# Uploads
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")


def _index() -> Path:
    dist = DIST_DIR / "index.html"
    return dist if dist.exists() else settings.STATIC_DIR / "index.html"


@app.get("/", include_in_schema=False)
async def root():
    return FileResponse(_index())


@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(full_path: str):
    return FileResponse(_index())
