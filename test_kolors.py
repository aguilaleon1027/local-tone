"""
Kolors Virtual Try-On 로컬 테스트 스크립트
실행: python test_kolors.py
결과: uploads/result_kolors_XXXX.jpg 로 저장됨
"""
import asyncio
import uuid
import sys
import os
from pathlib import Path

# 프로젝트 루트를 경로에 추가
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault("SUPABASE_URL", "dummy")
os.environ.setdefault("SUPABASE_KEY", "dummy")

from config import settings

# ── 테스트에 사용할 사진 경로 설정 ────────────────────────────
# 사람 사진 (업로드 폴더에서 선택)
PERSON_PHOTO = settings.UPLOAD_DIR / "ffcfcab7-4f9b-4ecc-bf3a-df2a9b25e2b7.jpg"

# 한복 이미지 — Supabase에서 가져오거나 로컬 파일 지정
# 아래 URL을 원하는 한복 이미지 URL로 바꿔주세요
HANBOK_URL = "https://hczspanespbdbpadpiun.supabase.co/storage/v1/object/public/hanbok-images/hanbok_10.jpg"


async def run_test():
    import httpx
    from gradio_client import Client, handle_file

    print("=" * 50)
    print("Kolors Virtual Try-On 테스트 시작")
    print("=" * 50)

    # 1. 사람 사진 확인
    if not PERSON_PHOTO.exists():
        print(f"❌ 사람 사진 없음: {PERSON_PHOTO}")
        print("uploads/ 폴더에 있는 파일명으로 바꿔주세요")
        return

    print(f"✅ 사람 사진: {PERSON_PHOTO.name} ({PERSON_PHOTO.stat().st_size // 1024}KB)")

    # 2. 한복 이미지 다운로드
    print(f"📥 한복 이미지 다운로드 중...")
    garment_path = settings.UPLOAD_DIR / f"tmp_kolors_garment_{uuid.uuid4().hex[:8]}.jpg"
    try:
        async with httpx.AsyncClient(verify=False, timeout=30) as http:
            resp = await http.get(HANBOK_URL)
            resp.raise_for_status()
            garment_path.write_bytes(resp.content)
        print(f"✅ 한복 이미지 다운로드 완료 ({garment_path.stat().st_size // 1024}KB)")
    except Exception as e:
        print(f"❌ 한복 이미지 다운로드 실패: {e}")
        return

    # 3. Kolors 실행
    def _sync_kolors():
        print("🔄 Kolors HF Space 연결 중...")
        client = Client(
            "Kwai-Kolors/Kolors-Virtual-Try-On",
            ssl_verify=False,
        )
        print("🔄 Kolors 피팅 실행 중 (최대 3분)...")
        return client.predict(
            human_img=handle_file(str(PERSON_PHOTO)),
            garm_img=handle_file(str(garment_path)),
            garment_des="Traditional Korean Hanbok",
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon",
        )

    try:
        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, _sync_kolors),
            timeout=180.0,
        )

        # 결과 파싱
        if isinstance(result, (list, tuple)):
            item = result[0]
        else:
            item = result

        if isinstance(item, dict):
            fitted_path = Path(item.get("path") or "")
        else:
            fitted_path = Path(str(item))

        if fitted_path.exists() and fitted_path.stat().st_size > 1000:
            out_path = settings.UPLOAD_DIR / f"result_kolors_{uuid.uuid4().hex[:8]}.jpg"
            out_path.write_bytes(fitted_path.read_bytes())
            print(f"\n✅ 성공! 결과 저장: uploads/{out_path.name}")
            print(f"   파일 크기: {out_path.stat().st_size // 1024}KB")
        else:
            print(f"❌ 결과 이미지가 비정상: {fitted_path}")

    except asyncio.TimeoutError:
        print("❌ 타임아웃 (3분 초과) — HF Space가 바쁠 수 있음, 잠시 후 재시도")
    except Exception as e:
        print(f"❌ 오류: {type(e).__name__}: {e}")
    finally:
        garment_path.unlink(missing_ok=True)
        print("\n임시 파일 정리 완료")


if __name__ == "__main__":
    asyncio.run(run_test())
