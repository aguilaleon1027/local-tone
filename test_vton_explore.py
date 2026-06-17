"""
가상 피팅 대안 모델 탐색 및 API 연결 테스트
현재 IDM-VTON 외 더 좋은 옵션들을 확인합니다.
"""
import sys, io, ssl, httpx, asyncio, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ssl._create_default_https_context = ssl._create_unverified_context
_oc = httpx.Client.__init__
def _pc(self,*a,**kw): kw.setdefault("verify",False); _oc(self,*a,**kw)
httpx.Client.__init__ = _pc
_oa = httpx.AsyncClient.__init__
def _pa(self,*a,**kw): kw.setdefault("verify",False); _oa(self,*a,**kw)
httpx.AsyncClient.__init__ = _pa

from gradio_client import Client
from config import settings

SPACES = [
    {
        "name": "① CatVTON",
        "id": "zhengchong/CatVTON",
        "desc": "2024 SOTA 모델 — 전신 피팅, 자연스러운 주름/재질 표현",
        "quality": "⭐⭐⭐⭐⭐",
    },
    {
        "name": "② Nymbo Virtual Try-On",
        "id": "nymbo/Virtual-Try-On",
        "desc": "IDM-VTON 기반, 빠른 속도, 간단한 API",
        "quality": "⭐⭐⭐⭐",
    },
    {
        "name": "③ IDM-VTON (현재 사용 중)",
        "id": "yisol/IDM-VTON",
        "desc": "현재 메인 모델 — 얼굴·체형 보존 우수",
        "quality": "⭐⭐⭐⭐",
    },
    {
        "name": "④ SketchEdit / StableVITON",
        "id": "rlawjdghek/StableVITON",
        "desc": "SD 기반 고해상도 피팅",
        "quality": "⭐⭐⭐",
    },
]

print("=" * 60)
print("  AI 가상 피팅 모델 연결 테스트")
print("=" * 60)

for space in SPACES:
    print(f"\n{space['name']}")
    print(f"  Space  : {space['id']}")
    print(f"  설명   : {space['desc']}")
    print(f"  품질   : {space['quality']}")
    print(f"  연결 테스트 중...", end="", flush=True)

    t0 = time.time()
    try:
        c = Client(space["id"], token=settings.HF_TOKEN or None, ssl_verify=False)
        elapsed = time.time() - t0
        # API 엔드포인트 목록 확인
        endpoints = [ep for ep in dir(c) if not ep.startswith("_")]
        print(f" ✅ 연결 성공 ({elapsed:.1f}s)")

        # API 정보 출력
        try:
            info = c.view_api(return_format="dict")
            named = info.get("named_endpoints", {})
            unnamed = info.get("unnamed_endpoints", {})
            print(f"  API 엔드포인트: {list(named.keys())[:5]}")
        except Exception as e:
            print(f"  API 정보 조회 실패: {e}")

    except Exception as e:
        elapsed = time.time() - t0
        print(f" ❌ 실패 ({elapsed:.1f}s): {type(e).__name__}: {str(e)[:80]}")

print("\n" + "=" * 60)
print("  상용 API 옵션 (무료 크레딧 제공)")
print("=" * 60)
commercial = [
    {
        "name": "Fashn.ai",
        "url": "https://fashn.ai",
        "free": "무료 크레딧 $10 제공 (약 250회)",
        "quality": "⭐⭐⭐⭐⭐ 현재 최고 품질",
        "api": "REST API, 키 발급 필요",
        "speed": "~10초",
    },
    {
        "name": "Replicate (IDM-VTON)",
        "url": "https://replicate.com/cuuupid/idm-vton",
        "free": "무료 크레딧 제공",
        "quality": "⭐⭐⭐⭐ IDM-VTON 동일",
        "api": "REST API, 키 발급 필요",
        "speed": "~30초",
    },
    {
        "name": "KlingAI Virtual Try-On",
        "url": "https://platform.klingai.com",
        "free": "무료 크레딧 제공",
        "quality": "⭐⭐⭐⭐⭐ 영상 피팅도 가능",
        "api": "REST API, 키 발급 필요",
        "speed": "~20초",
    },
]
for c in commercial:
    print(f"\n  {c['name']}")
    print(f"    품질  : {c['quality']}")
    print(f"    속도  : {c['speed']}")
    print(f"    무료  : {c['free']}")
    print(f"    URL   : {c['url']}")

print("\n" + "=" * 60)
