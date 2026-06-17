"""각 이미지 생성 방법별 실패 원인 진단"""
import sys, io, ssl, httpx, asyncio
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ssl._create_default_https_context = ssl._create_unverified_context
_orig_c = httpx.Client.__init__
def _p(self, *a, **kw): kw.setdefault("verify", False); _orig_c(self, *a, **kw)
httpx.Client.__init__ = _p
_orig_a = httpx.AsyncClient.__init__
def _pa(self, *a, **kw): kw.setdefault("verify", False); _orig_a(self, *a, **kw)
httpx.AsyncClient.__init__ = _pa

async def main():
    # ── 1. Pollinations 연결 테스트 ─────────────────────────
    print("[1] Pollinations AI 연결 테스트...")
    try:
        async with httpx.AsyncClient(verify=False, timeout=30) as c:
            r = await c.get("https://image.pollinations.ai/prompt/test?width=64&height=64&nologo=true&model=flux")
            print(f"    HTTP {r.status_code} | {len(r.content):,} bytes")
            if r.status_code == 200 and len(r.content) > 500:
                print("    → [OK] Pollinations 작동함")
            else:
                print("    → [FAIL] 응답 비정상")
    except Exception as e:
        print(f"    → [FAIL] {type(e).__name__}: {e}")

    # ── 2. HuggingFace API 연결 테스트 ─────────────────────
    from config import settings
    print(f"\n[2] HuggingFace API 연결 테스트 (HF_TOKEN: {'있음' if settings.HF_TOKEN else '없음'})...")
    try:
        async with httpx.AsyncClient(verify=False, timeout=15) as c:
            r = await c.get(
                "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
                headers={"Authorization": f"Bearer {settings.HF_TOKEN}"},
            )
            print(f"    HTTP {r.status_code}")
            if r.status_code in (200, 503):  # 503 = model loading
                print("    → [OK] HuggingFace API 접근 가능")
            else:
                print(f"    → [FAIL] {r.text[:100]}")
    except Exception as e:
        print(f"    → [FAIL] {type(e).__name__}: {e}")

    # ── 3. HuggingFace Space 연결 테스트 ───────────────────
    print("\n[3] HuggingFace Space (IDM-VTON) 연결 테스트...")
    try:
        async with httpx.AsyncClient(verify=False, timeout=15) as c:
            r = await c.get("https://yisol-idm-vton.hf.space/")
            print(f"    HTTP {r.status_code} | {len(r.content):,} bytes")
            print("    → [OK] Space 접근 가능")
    except Exception as e:
        print(f"    → [FAIL] {type(e).__name__}: {e}")

    # ── 4. gradio_client SSL 테스트 ─────────────────────────
    print("\n[4] gradio_client 직접 연결 테스트...")
    try:
        from gradio_client import Client
        def _sync():
            c = Client("yisol/IDM-VTON", token=settings.HF_TOKEN or None, ssl_verify=False)
            return "연결 성공"
        loop = asyncio.get_running_loop()
        result = await asyncio.wait_for(loop.run_in_executor(None, _sync), timeout=30)
        print(f"    → [OK] {result}")
    except asyncio.TimeoutError:
        print("    → [FAIL] 30초 타임아웃")
    except Exception as e:
        print(f"    → [FAIL] {type(e).__name__}: {e}")

asyncio.run(main())
