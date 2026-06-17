"""서버 컨텍스트와 동일하게 fitting 로직 직접 실행 (서버 없이)"""
import sys, io, asyncio, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# ── main.py와 동일한 SSL 패치를 가장 먼저 ────────────────────
import ssl, httpx
ssl._create_default_https_context = ssl._create_unverified_context
_orig_client = httpx.Client.__init__
def _patched_client(self, *a, **kw): kw.setdefault('verify', False); _orig_client(self, *a, **kw)
httpx.Client.__init__ = _patched_client
_orig_async = httpx.AsyncClient.__init__
def _patched_async(self, *a, **kw): kw.setdefault('verify', False); _orig_async(self, *a, **kw)
httpx.AsyncClient.__init__ = _patched_async

# ── config / db ──────────────────────────────────────────────
from pathlib import Path
from config import settings
from db import get_db

# 가장 최근 업로드 사진
uploads = sorted(
    [f for f in settings.UPLOAD_DIR.glob("*.jpg")
     if not f.stem.startswith("result") and not f.stem.startswith("tmp")],
    key=lambda f: f.stat().st_mtime, reverse=True
)
if not uploads:
    # test_photo.jpg 사용
    photo_path = Path("test_photo.jpg")
else:
    photo_path = uploads[0]

print(f"[사진] {photo_path.name} ({photo_path.stat().st_size:,} bytes)")

# 한복 ID (image_url 있는 것)
db = get_db()
rows = db.table("hanbok").select("id,title,image_url,color,category").not_.is_("image_url","null").limit(3).execute().data
hanbok = rows[0]
print(f"[한복] {hanbok['title']} | {hanbok.get('color','?')} | {hanbok.get('category','?')}")
print(f"       image_url: {hanbok['image_url'][:60]}..." if hanbok['image_url'] else "       image_url: 없음")

# ── fitting 모듈 import (fitting.py 내부 패치도 실행됨) ────────
from routers.fitting import (
    _generate_fitting_image,
    _idm_vton_try_on,
    _ootd_try_on,
    _hf_flux_generate,
    _pollinations_fallback,
    _fetch_url_bytes,
)
import uuid

async def run():
    # 한복 이미지 다운로드
    print("\n[STEP 1] 한복 이미지 다운로드...")
    t0 = time.time()
    try:
        data, mime = await _fetch_url_bytes(hanbok["image_url"])
        ext = ".png" if "png" in mime else ".jpg"
        garment_path = settings.UPLOAD_DIR / f"tmp_garment_{uuid.uuid4()}{ext}"
        garment_path.write_bytes(data)
        print(f"  → 성공: {len(data):,} bytes ({time.time()-t0:.1f}s)")
    except Exception as e:
        print(f"  → 실패: {e}")
        garment_path = None

    garment_desc = (
        f"Traditional Korean hanbok '{hanbok.get('title', '')}'"
        + (f", {hanbok['color']} color" if hanbok.get("color") else "")
        + (f", {hanbok['category']} style" if hanbok.get("category") else "")
    )

    # IDM-VTON 단독 테스트
    if garment_path:
        print(f"\n[STEP 2] IDM-VTON 단독 테스트...")
        t0 = time.time()
        try:
            result = await _idm_vton_try_on(photo_path, garment_path, garment_desc)
            elapsed = time.time() - t0
            if result:
                print(f"  → ✅ 성공: {result.name} ({elapsed:.1f}s)")
                return
            else:
                print(f"  → 실패/None 반환 ({elapsed:.1f}s)")
        except Exception as e:
            elapsed = time.time() - t0
            print(f"  → 예외: {type(e).__name__}: {e} ({elapsed:.1f}s)")

    # FLUX 테스트
    print(f"\n[STEP 3] FLUX.1-schnell 테스트...")
    t0 = time.time()
    try:
        result = await _hf_flux_generate(hanbok)
        elapsed = time.time() - t0
        print(f"  → {'✅ 성공' if result else '실패/None'} ({elapsed:.1f}s)")
    except Exception as e:
        elapsed = time.time() - t0
        print(f"  → 예외: {e} ({elapsed:.1f}s)")

    # Pollinations 테스트
    print(f"\n[STEP 4] Pollinations 테스트...")
    t0 = time.time()
    try:
        result = await _pollinations_fallback(hanbok)
        elapsed = time.time() - t0
        if result:
            print(f"  → ✅ 성공: {result.name} ({elapsed:.1f}s)")
        else:
            print(f"  → 실패/None ({elapsed:.1f}s)")
    except Exception as e:
        elapsed = time.time() - t0
        print(f"  → 예외: {e} ({elapsed:.1f}s)")

    # 정리
    if garment_path and garment_path.exists():
        garment_path.unlink()

asyncio.run(run())
