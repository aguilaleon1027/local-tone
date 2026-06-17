"""서버 API 직접 테스트 — 웹앱과 동일한 흐름"""
import sys, io, requests, json, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

BASE = "http://localhost:8000"

# 1. 헬스체크
try:
    r = requests.get(f"{BASE}/health", timeout=5, verify=False)
    print(f"[헬스체크] {r.status_code} — {r.json()}")
except Exception as e:
    print(f"[헬스체크 실패] 서버가 실행 중인지 확인하세요: {e}")
    sys.exit(1)

# 2. 최근 업로드된 사진 사용 (웹앱에서 업로드된 것)
from pathlib import Path
uploads = sorted(
    [f for f in Path("uploads").glob("*.jpg") if not f.stem.startswith("result")
     and not f.stem.startswith("test") and not f.stem.startswith("tmp")],
    key=lambda f: f.stat().st_mtime, reverse=True
)
if not uploads:
    print("[ERROR] 업로드된 사진이 없습니다. 웹에서 사진을 먼저 업로드하세요.")
    sys.exit(1)

photo_path = uploads[0]
photo_id = photo_path.stem
print(f"\n[사진] {photo_path.name} ({photo_path.stat().st_size:,} bytes)")

# 3. 한복 ID 가져오기
from db import get_db
db = get_db()
hanbok = db.table("hanbok").select("id,title,image_url").not_.is_("image_url","null").limit(1).execute().data[0]
print(f"[한복] {hanbok['title']} | id={hanbok['id'][:8]}...")

# 4. /api/fitting/generate 호출
print(f"\n[피팅 요청 전송] → POST {BASE}/api/fitting/generate")
print("  (IDM-VTON은 최대 3분 소요됩니다...)")
start = time.time()

try:
    r = requests.post(
        f"{BASE}/api/fitting/generate",
        data={"photo_id": photo_id, "hanbok_id": hanbok["id"]},
        timeout=300,
        verify=False,
    )
    elapsed = time.time() - start
    print(f"  응답 시간: {elapsed:.1f}초  |  HTTP {r.status_code}")

    if r.status_code == 200:
        data = r.json()
        print(f"\n[응답 결과]")
        print(f"  status           : {data.get('status')}")
        print(f"  result_image_url : {data.get('result_image_url')}")
        print(f"  ai_recommendation: {'있음' if data.get('ai_recommendation') else '없음'}")
        if data.get('result_image_url'):
            print(f"\n[성공] 피팅 이미지: {data['result_image_url']}")
        else:
            print(f"\n[주의] result_image_url 이 null — 이미지 생성 실패")
    else:
        print(f"  [ERROR] {r.status_code}: {r.text[:300]}")

except requests.exceptions.Timeout:
    print("  [TIMEOUT] 300초 초과 — 서버 응답 없음")
except Exception as e:
    print(f"  [ERROR] {type(e).__name__}: {e}")
