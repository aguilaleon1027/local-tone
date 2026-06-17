"""
IDM-VTON 테스트 — test_photo2 + 한복 2호
"""
import sys, io, asyncio, uuid, ssl, httpx
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# ── 전역 SSL 패치 (httpx + stdlib) ──────────────────────────
ssl._create_default_https_context = ssl._create_unverified_context

_orig_c = httpx.Client.__init__
def _no_ssl_c(self, *args, **kwargs):
    kwargs.setdefault("verify", False)
    _orig_c(self, *args, **kwargs)
httpx.Client.__init__ = _no_ssl_c

_orig_a = httpx.AsyncClient.__init__
def _no_ssl_a(self, *args, **kwargs):
    kwargs.setdefault("verify", False)
    _orig_a(self, *args, **kwargs)
httpx.AsyncClient.__init__ = _no_ssl_a

# ── 환경 설정 ─────────────────────────────────────────────
from pathlib import Path
from PIL import Image
from config import settings
from db import get_db

PHOTO_AVIF = Path("uploads/test_photo2.avif")
PHOTO_JPG  = Path("uploads/test_photo2_converted.jpg")

# AVIF → JPEG 변환 (pillow-heif 사용)
print("[변환] test_photo2.avif → JPEG 변환 중...")
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
    img = Image.open(PHOTO_AVIF).convert("RGB")
    img.save(PHOTO_JPG, "JPEG", quality=95)
    print(f"  OK: {PHOTO_JPG.name} ({PHOTO_JPG.stat().st_size:,} bytes)  {img.size[0]}x{img.size[1]}px")
except Exception as e:
    print(f"  [ERROR] 변환 실패: {e}")
    sys.exit(1)

# 한복 2호 정보
db   = get_db()
rows = db.table("hanbok").select("id,title,color,category,image_url").eq("title","한복 2호").execute()
if not rows.data:
    print("[ERROR] 한복 2호를 찾을 수 없습니다.")
    sys.exit(1)

HANBOK = rows.data[0]
print(f"\n[테스트 한복]  {HANBOK['title']}  |  {HANBOK['image_url']}")
print(f"[테스트 사진]  {PHOTO_JPG.name}  ({PHOTO_JPG.stat().st_size:,} bytes)\n")


async def run():
    from routers.fitting import _idm_vton_try_on, _ootd_try_on, _fetch_url_bytes

    # 한복 이미지 다운로드
    print("[1] 한복 2호 이미지 다운로드...")
    data, mime = await _fetch_url_bytes(HANBOK["image_url"])
    garment_path = settings.UPLOAD_DIR / f"tmp_hanbok2_{uuid.uuid4()}.jpg"
    garment_path.write_bytes(data)
    print(f"    {garment_path.name}  ({len(data):,} bytes)")

    garment_desc = (
        f"Traditional Korean hanbok '{HANBOK.get('title', '')}'"
        + (f", {HANBOK['color']} color"    if HANBOK.get("color")    else "")
        + (f", {HANBOK['category']} style" if HANBOK.get("category") else "")
    )

    # IDM-VTON
    print("\n[2] IDM-VTON 가상 피팅 시도 (최대 3분)...")
    result = await _idm_vton_try_on(PHOTO_JPG, garment_path, garment_desc)
    if result:
        print(f"\n[결과] IDM-VTON 성공!")
        print(f"  파일: {result}")
        print(f"  크기: {result.stat().st_size:,} bytes")
        garment_path.unlink(missing_ok=True)
        return result

    # OOTDiffusion 폴백
    print("\n[3] OOTDiffusion 폴백 시도...")
    result = await _ootd_try_on(PHOTO_JPG, garment_path)
    garment_path.unlink(missing_ok=True)
    if result:
        print(f"\n[결과] OOTDiffusion 성공!  {result}")
        return result

    print("\n[결과] 실패.")

result = asyncio.run(run())

# 결과 이미지 자동으로 열기
if result and result.exists():
    import subprocess
    subprocess.Popen(["explorer", str(result)])
