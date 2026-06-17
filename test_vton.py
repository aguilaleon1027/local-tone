"""
IDM-VTON 가상 피팅 테스트 스크립트
사용법: python test_vton.py <내사진.jpg>
예시 : python test_vton.py C:/Users/leon/Desktop/나.jpg
"""
import sys
import asyncio
import io
import ssl
import httpx
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# ── Windows 기업 프록시 SSL 전역 패치 (gradio_client 포함 모든 httpx) ──
ssl._create_default_https_context = ssl._create_unverified_context

_orig_client_init = httpx.Client.__init__
def _no_ssl_client_init(self, *args, **kwargs):
    kwargs.setdefault("verify", False)
    _orig_client_init(self, *args, **kwargs)
httpx.Client.__init__ = _no_ssl_client_init

_orig_async_client_init = httpx.AsyncClient.__init__
def _no_ssl_async_client_init(self, *args, **kwargs):
    kwargs.setdefault("verify", False)
    _orig_async_client_init(self, *args, **kwargs)
httpx.AsyncClient.__init__ = _no_ssl_async_client_init

from pathlib import Path

if len(sys.argv) < 2:
    print("사용법: python test_vton.py <사진 경로>")
    print("예시 : python test_vton.py C:/Users/leon/Desktop/나.jpg")
    sys.exit(1)

photo_path = Path(sys.argv[1])
if not photo_path.exists():
    print(f"[ERROR] 파일 없음: {photo_path}")
    sys.exit(1)

# ── 환경 설정 ──────────────────────────────────────────────────
from config import settings
from db import get_db
import httpx

# 테스트용 한복 (DB에서 image_url 있는 것 자동 선택)
db   = get_db()
rows = db.table("hanbok").select("id, title, color, category, image_url") \
         .not_.is_("image_url", "null").limit(1).execute()

if not rows.data:
    print("[ERROR] image_url이 있는 한복이 없습니다. Supabase 데이터를 확인하세요.")
    sys.exit(1)

HANBOK = rows.data[0]
print(f"\n[테스트 한복]")
print(f"  id      : {HANBOK['id']}")
print(f"  title   : {HANBOK['title']}")
print(f"  image   : {HANBOK['image_url']}")
print(f"[테스트 사진] {photo_path.name} ({photo_path.stat().st_size:,} bytes)\n")


async def test_idm_vton():
    from routers.fitting import _idm_vton_try_on, _ootd_try_on, _hf_flux_generate, _fetch_url_bytes
    import uuid

    upload_dir = settings.UPLOAD_DIR
    upload_dir.mkdir(parents=True, exist_ok=True)

    # 1. 한복 이미지 다운로드
    print("[1] 한복 이미지 다운로드 중...")
    try:
        data, mime = await _fetch_url_bytes(HANBOK["image_url"])
        ext = ".png" if "png" in mime else ".jpg"
        garment_path = upload_dir / f"test_garment_{uuid.uuid4()}{ext}"
        garment_path.write_bytes(data)
        print(f"    OK: {garment_path.name} ({len(data):,} bytes)")
    except Exception as e:
        print(f"    [ERROR] 한복 이미지 다운로드 실패: {e}")
        sys.exit(1)

    garment_desc = (
        f"Traditional Korean hanbok '{HANBOK.get('title', '')}'"
        + (f", {HANBOK['color']} color"    if HANBOK.get("color")    else "")
        + (f", {HANBOK['category']} style" if HANBOK.get("category") else "")
    )

    # 2. IDM-VTON 시도
    print("\n[2] IDM-VTON 가상 피팅 시도 (최대 3분 소요)...")
    result = await _idm_vton_try_on(photo_path, garment_path, garment_desc)
    if result:
        print(f"\n[결과] IDM-VTON 성공!")
        print(f"  저장 위치: {result}")
        print(f"  파일 크기: {result.stat().st_size:,} bytes")
        garment_path.unlink(missing_ok=True)
        return

    # 3. OOTDiffusion 폴백
    print("\n[3] OOTDiffusion 폴백 시도 (최대 3분 소요)...")
    result = await _ootd_try_on(photo_path, garment_path)
    if result:
        print(f"\n[결과] OOTDiffusion 성공!")
        print(f"  저장 위치: {result}")
        garment_path.unlink(missing_ok=True)
        return

    garment_path.unlink(missing_ok=True)

    # 4. FLUX 폴백
    print("\n[4] FLUX.1-schnell 폴백 시도...")
    result = await _hf_flux_generate(HANBOK)
    if result:
        print(f"\n[결과] FLUX 성공!")
        print(f"  저장 위치: {result}")
        return

    print("\n[결과] 모든 방법 실패. 서버 로그를 확인하세요.")


asyncio.run(test_idm_vton())
