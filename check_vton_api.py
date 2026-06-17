import sys, io, ssl, httpx
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ssl._create_default_https_context = ssl._create_unverified_context
_orig = httpx.Client.__init__
def _p(self, *a, **kw): kw.setdefault("verify", False); _orig(self, *a, **kw)
httpx.Client.__init__ = _p

from gradio_client import Client

print("=== IDM-VTON API 스펙 확인 ===\n")
client = Client("yisol/IDM-VTON", ssl_verify=False)
client.view_api()
