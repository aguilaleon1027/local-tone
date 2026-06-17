"""
가상 피팅 Gemini API 테스트 스크립트
실행: python test_fitting.py <이미지_경로>
예시: python test_fitting.py uploads/내사진.jpg
"""
import sys
import asyncio
from pathlib import Path

# ── Windows SSL 인증서 패치 ────────────────────────────────────
import os, certifi, httpx
# 환경변수로 Python 전역 SSL CA 번들 지정 (gRPC·requests 모두 커버)
os.environ.setdefault('SSL_CERT_FILE',      certifi.where())
os.environ.setdefault('REQUESTS_CA_BUNDLE', certifi.where())
# ─────────────────────────────────────────────────────────────

# ── 환경변수 로드 ──
from config import settings

if not settings.GEMINI_API_KEY:
    print("[ERROR] .env 에 GEMINI_API_KEY 가 설정되지 않았습니다.")
    print("  .env 파일에 아래 줄을 추가해주세요:")
    print("  GEMINI_API_KEY=AIzaSy...")
    sys.exit(1)

from google import genai
from google.genai import types as genai_types

# 테스트용 더미 한복 데이터
DUMMY_HANBOK = {
    "id": "test-001",
    "title": "진홍 혼례 한복",
    "color": "진홍, 청색",
    "category": "혼례",
    "image_url": None,
}

IMAGE_GEN_MODELS = [
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
]


def _build_vton_prompt(hanbok: dict) -> str:
    return (
        "Virtual clothing try-on. "
        "Using the attached photo of a person, replace ONLY their current outfit "
        "with the traditional Korean hanbok described below. "
        "STRICT rules:\n"
        "1. Preserve the person's face, hair, skin tone, body proportions, "
        "and pose EXACTLY as in the original photo.\n"
        f"2. Hanbok to apply: '{hanbok['title']}' "
        f"({hanbok['category']} style), color: {hanbok['color']}.\n"
        "3. Replace the background with a serene traditional Korean palace garden.\n"
        "4. Professional fashion photograph, full-body shot, photorealistic, high detail."
    )


def _make_genai_client() -> genai.Client:
    """Windows SSL 프록시 환경을 우회하는 genai 클라이언트 생성.
    verify=False httpx 클라이언트를 SDK에 직접 주입해 SSL 검증을 우회한다."""
    no_ssl_client = httpx.AsyncClient(verify=False, timeout=60.0)
    return genai.Client(
        api_key=settings.GEMINI_API_KEY,
        http_options=genai_types.HttpOptions(
            httpx_async_client=no_ssl_client,
        ),
    )


async def test_image_generation(photo_path: Path):
    client = _make_genai_client()
    photo_bytes = photo_path.read_bytes()
    mime_map    = {".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                   ".png": "image/png",  ".webp": "image/webp"}
    mime_type   = mime_map.get(photo_path.suffix.lower(), "image/jpeg")
    prompt      = _build_vton_prompt(DUMMY_HANBOK)

    print(f"\n[TEST] 사진: {photo_path.name}  ({len(photo_bytes):,} bytes, {mime_type})")
    print(f"[TEST] 테스트 한복: {DUMMY_HANBOK['title']}")
    print()

    for model_id in IMAGE_GEN_MODELS:
        print(f"[TEST] 모델 시도: {model_id}")
        try:
            response = await client.aio.models.generate_content(
                model=model_id,
                contents=[
                    genai_types.Part.from_text(text=prompt),
                    genai_types.Part.from_bytes(data=photo_bytes, mime_type=mime_type),
                ],
                config=genai_types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                ),
            )

            saved = False
            for part in (response.parts or []):
                if part.inline_data and part.inline_data.data:
                    out = Path("uploads") / f"test_result_{model_id.replace('-','_')}.jpg"
                    out.write_bytes(part.inline_data.data)
                    print(f"  [OK] 이미지 생성 성공! -> {out}")
                    print(f"       크기: {len(part.inline_data.data):,} bytes")
                    saved = True
                    break
                elif part.text:
                    print(f"  [TEXT] 모델 응답: {part.text[:200]!r}")

            if not saved:
                print(f"  [WARN] {model_id}: 이미지 파트 없음 — 다음 모델 시도")
                continue

            print(f"\n[TEST] 성공! 사용 모델: {model_id}")
            break

        except Exception as e:
            print(f"  [ERROR] {model_id} 실패: {type(e).__name__}: {e}")

    # 텍스트 모델 (gemini-2.5-flash) 도 간단히 테스트
    print(f"\n[TEST] 텍스트 모델 테스트: {settings.GEMINI_MODEL}")
    try:
        resp = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents="안녕? 장금이 한복에서 AI 피팅 테스트 중이야. 한 줄로 답해줘.",
        )
        print(f"  [OK] 응답: {resp.text.strip()[:100]}")
    except Exception as e:
        print(f"  [ERROR] {type(e).__name__}: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python test_fitting.py <이미지_파일_경로>")
        print("예시 : python test_fitting.py uploads/내사진.jpg")
        sys.exit(1)

    photo = Path(sys.argv[1])
    if not photo.exists():
        print(f"[ERROR] 파일을 찾을 수 없습니다: {photo}")
        sys.exit(1)

    asyncio.run(test_image_generation(photo))
