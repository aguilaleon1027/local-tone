"""
바탕화면 hanbok_*.jpg → Supabase Storage 업로드 + Gemini 이미지 분석 + DB INSERT
실행: python upload_hanbok.py
"""

import asyncio
import os
import sys
import certifi
import httpx
from pathlib import Path

# ── Windows SSL 패치 ───────────────────────────────────────────
os.environ.setdefault("SSL_CERT_FILE",      certifi.where())
os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())
# ─────────────────────────────────────────────────────────────

from config import settings

# ── 설정 ──────────────────────────────────────────────────────
DESKTOP     = Path.home() / "Desktop"
BUCKET      = "hanbok-images"
VALID_EXTS  = {".jpg", ".jpeg", ".png", ".webp"}
# ─────────────────────────────────────────────────────────────

# Supabase anon key → service_role key 없어도 storage upsert 가능하도록
# public bucket이면 anon key로 업로드 가능
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY


# ── Supabase Storage 업로드 (httpx 직접 호출) ─────────────────

async def upload_to_storage(
    http: httpx.AsyncClient,
    file_bytes: bytes,
    filename: str,
    content_type: str = "image/jpeg",
) -> str:
    """
    Supabase Storage REST API로 파일 업로드.
    이미 존재하면 덮어쓰기 (upsert).
    반환: public URL 문자열
    """
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}"
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  content_type,
        "x-upsert":      "true",          # 기존 파일 덮어쓰기
    }
    resp = await http.put(url, content=file_bytes, headers=headers, timeout=60)

    if resp.status_code not in (200, 201):
        raise RuntimeError(
            f"Storage 업로드 실패 ({resp.status_code}): {resp.text[:200]}"
        )

    public_url = (
        f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
    )
    return public_url


# ── Supabase REST API: DB upsert ──────────────────────────────

async def upsert_hanbok_row(
    http: httpx.AsyncClient,
    row: dict,
) -> None:
    url = f"{SUPABASE_URL}/rest/v1/hanbok"
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates",  # upsert
    }
    resp = await http.post(url, json=row, headers=headers, timeout=15)
    if resp.status_code not in (200, 201):
        raise RuntimeError(
            f"DB upsert 실패 ({resp.status_code}): {resp.text[:200]}"
        )


# ── Gemini: 한복 이미지 자동 분석 ────────────────────────────

async def analyze_hanbok_image(
    client,          # genai.Client
    image_bytes: bytes,
    mime_type: str,
    filename: str,
) -> dict:
    """
    Gemini로 한복 사진 분석 → title / category / color 자동 추출
    """
    from google.genai import types as genai_types

    prompt = (
        "이 한복 이미지를 분석해 주세요. "
        "다른 설명 없이 아래 형식만 정확히 출력하세요:\n\n"
        "제목: [한복 이름 (예: 진홍 혼례 한복, 연두 봄 한복)]\n"
        "카테고리: [혼례 / 궁중 / 현대 / 일상 / 생활 / 남성 / 아동 / 명절 / 행사 중 하나]\n"
        "색상: [주요 색상 최대 2가지, 한국어로 (예: 진홍, 청색)]"
    )

    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=[
            genai_types.Part.from_text(text=prompt),
            genai_types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        ],
    )

    # ── 응답 파싱 ──────────────────────────────────────────────
    result = {
        "title":    filename,   # 파싱 실패 시 파일명 사용
        "category": "일상",
        "color":    "",
    }
    for line in response.text.strip().splitlines():
        line = line.strip()
        if line.startswith("제목:"):
            result["title"]    = line[3:].strip()
        elif line.startswith("카테고리:"):
            result["category"] = line[5:].strip()
        elif line.startswith("색상:"):
            result["color"]    = line[3:].strip()

    return result


# ── Supabase: public bucket 존재 확인 / 생성 ─────────────────

async def ensure_bucket(http: httpx.AsyncClient) -> None:
    """버킷이 없으면 public 버킷으로 생성"""
    # 목록 조회
    list_url = f"{SUPABASE_URL}/storage/v1/bucket"
    headers  = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    resp = await http.get(list_url, headers=headers)
    buckets = resp.json() if resp.status_code == 200 else []

    existing = {b["name"] for b in buckets} if isinstance(buckets, list) else set()
    if BUCKET in existing:
        print(f"[bucket] '{BUCKET}' 이미 존재 — 건너뜀")
        return

    # 생성
    create_url = f"{SUPABASE_URL}/storage/v1/bucket"
    payload    = {"id": BUCKET, "name": BUCKET, "public": True}
    resp = await http.post(create_url, json=payload, headers={
        **headers, "Content-Type": "application/json"
    })
    if resp.status_code in (200, 201):
        print(f"[bucket] '{BUCKET}' 생성 완료")
    else:
        print(f"[bucket] 생성 응답 ({resp.status_code}): {resp.text[:200]}")


# ── 메인 ──────────────────────────────────────────────────────

async def main():
    # 바탕화면에서 hanbok_*.jpg 탐색
    files = sorted(
        p for p in DESKTOP.glob("hanbok_*")
        if p.suffix.lower() in VALID_EXTS
    )

    if not files:
        print(f"[ERROR] 바탕화면({DESKTOP})에 hanbok_* 파일이 없습니다.")
        sys.exit(1)

    print(f"\n바탕화면 한복 사진 {len(files)}장 발견:")
    for f in files:
        print(f"  {f.name}  ({f.stat().st_size // 1024} KB)")

    if not settings.GEMINI_API_KEY:
        print("\n[WARN] GEMINI_API_KEY 미설정 → AI 분석 없이 파일명으로 저장")

    print()

    # ── HTTP 클라이언트 (SSL certifi) ─────────────────────────
    http = httpx.AsyncClient(verify=certifi.where(), timeout=60)

    # ── Gemini 클라이언트 ──────────────────────────────────────
    gemini_client = None
    if settings.GEMINI_API_KEY:
        from google import genai
        from google.genai import types as genai_types
        ssl_http = httpx.AsyncClient(verify=certifi.where(), timeout=60)
        gemini_client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=genai_types.HttpOptions(httpx_async_client=ssl_http),
        )

    # ── Supabase Storage 버킷 확인 ────────────────────────────
    await ensure_bucket(http)
    print()

    # ── 파일별 처리 ───────────────────────────────────────────
    success, failed = 0, 0

    for idx, photo_path in enumerate(files, 1):
        print(f"[{idx:02d}/{len(files)}] {photo_path.name}")

        suffix       = photo_path.suffix.lower()
        mime_map     = {".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                        ".png": "image/png",  ".webp": "image/webp"}
        mime_type    = mime_map.get(suffix, "image/jpeg")
        image_bytes  = photo_path.read_bytes()

        # ① Supabase Storage 업로드
        try:
            public_url = await upload_to_storage(
                http, image_bytes, photo_path.name, mime_type
            )
            print(f"  ✅ Storage 업로드 → {public_url}")
        except Exception as e:
            print(f"  ❌ 업로드 실패: {e}")
            failed += 1
            continue

        # ② Gemini 이미지 분석
        if gemini_client:
            try:
                info = await analyze_hanbok_image(
                    gemini_client, image_bytes, mime_type, photo_path.stem
                )
                print(f"  🤖 AI 분석 → 제목: {info['title']}, "
                      f"카테고리: {info['category']}, 색상: {info['color']}")
            except Exception as e:
                print(f"  ⚠️  AI 분석 실패 ({e}) — 파일명으로 대체")
                info = {
                    "title":    photo_path.stem,
                    "category": "일상",
                    "color":    "",
                }
        else:
            # API 키 없을 때 기본값
            num = "".join(filter(str.isdigit, photo_path.stem))
            info = {
                "title":    f"한복 {num}호",
                "category": "일상",
                "color":    "",
            }

        # ③ Supabase DB upsert
        hanbok_id = f"hb-{photo_path.stem}"   # 예: hb-hanbok_4
        row = {
            "id":           hanbok_id,
            "title":        info["title"],
            "category":     info["category"],
            "color":        info["color"],
            "image_url":    public_url,
            "is_available": True,
        }
        try:
            await upsert_hanbok_row(http, row)
            print(f"  💾 DB 저장 완료 (id: {hanbok_id})")
            success += 1
        except Exception as e:
            print(f"  ❌ DB 저장 실패: {e}")
            failed += 1

        print()

    await http.aclose()

    print("=" * 50)
    print(f"✅ 완료: 성공 {success}장 / 실패 {failed}장")
    if success:
        print(f"\n🌐 Supabase Storage 확인:")
        print(f"   https://supabase.com/dashboard/project/hczspanespbdbpadpiun/storage/buckets/{BUCKET}")
        print(f"\n🗄️  Supabase DB 확인:")
        print(f"   https://supabase.com/dashboard/project/hczspanespbdbpadpiun/editor")


if __name__ == "__main__":
    asyncio.run(main())
