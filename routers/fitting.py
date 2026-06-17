import uuid
import asyncio
import httpx
import ssl
import urllib.parse
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from google import genai
from google.genai import types as genai_types
from models import FittingResult
from config import settings
from db import get_db

# ── Windows 기업 프록시 환경 SSL 전역 패치 ───────────────────
# 방법1: stdlib ssl (urllib, requests 계열)
ssl._create_default_https_context = ssl._create_unverified_context

# 방법2: httpx 전역 패치 (gradio_client 내부 포함 모든 httpx 요청)
# gradio_client는 Client 초기화 시 내부 httpx.Client를 직접 생성하므로
# ssl_verify=False 파라미터만으로는 초기 요청에 적용이 안 됨 → 전역 패치 필요
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

router = APIRouter()

_MIME_MAP = {
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".webp": "image/webp",
}
_ALLOWED_EXTS = tuple(_MIME_MAP.keys())


# ── 유효성 검사 ──────────────────────────────────────────────

def _validate_image(file: UploadFile):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 허용: {', '.join(settings.ALLOWED_IMAGE_TYPES)}",
        )


def _load_hanbok(hanbok_id: str) -> dict:
    result = (
        get_db().table("hanbok").select("*")
        .eq("id", hanbok_id).maybe_single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="선택한 한복을 찾을 수 없습니다.")
    return result.data


def _find_photo(photo_id: str) -> Path:
    for ext in _ALLOWED_EXTS:
        p = settings.UPLOAD_DIR / f"{photo_id}{ext}"
        if p.exists():
            return p
    raise HTTPException(status_code=404, detail="업로드된 사진을 찾을 수 없습니다.")


# ── 유틸 ─────────────────────────────────────────────────────

async def _fetch_url_bytes(url: str) -> tuple[bytes, str]:
    """URL에서 이미지 바이트 다운로드 (SSL 검증 없이)"""
    async with httpx.AsyncClient(timeout=30, verify=False) as http:
        resp = await http.get(url)
        resp.raise_for_status()
        mime = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        return resp.content, mime


# ──────────────────────────────────────────────────────────────────────────────
# 가상 피팅 이미지 생성 우선순위
#
#  ① IDM-VTON      — 업계 표준 Virtual Try-On. 얼굴·체형·포즈 완전 보존 +
#                    한복 이미지 디자인 정확 합성. (한복 image_url 필요)
#  ② OOTDiffusion  — IDM-VTON 폴백. 동등 품질의 가상 피팅. (한복 image_url 필요)
#  ③ FLUX.1-schnell — HuggingFace Inference API. 텍스트→이미지.
#                    HF_TOKEN 필요. 한복 이미지 불필요.
#  ④ Pollinations  — 완전 무료 최후 수단. API키 불필요.
#
#  ①②는 hanbok.image_url이 있을 때만 진짜 Virtual Try-On 동작.
#  image_url 없으면 ③④ 텍스트 기반 생성으로 자동 폴백.
# ──────────────────────────────────────────────────────────────────────────────


# ── ① IDM-VTON (진짜 가상 피팅 — 최고 품질) ─────────────────
# HuggingFace Space: yisol/IDM-VTON
# 입력: 사람 사진 + 한복 이미지 + 한복 설명
# 출력: 사람 얼굴·체형·포즈 그대로 + 한복 합성

async def _idm_vton_try_on(
    person_path: Path,
    garment_path: Path,
    garment_desc: str,
) -> Optional[Path]:
    """IDM-VTON: 업계 표준 Virtual Try-On. 얼굴·체형 100% 보존 + 한복 합성."""
    try:
        from gradio_client import Client, handle_file
    except ImportError:
        print("[fitting] gradio_client 미설치 → IDM-VTON 건너뜀 (pip install gradio_client)")
        return None

    def _sync_call():
        client = Client(
            "yisol/IDM-VTON",
            token=settings.HF_TOKEN or None,
            ssl_verify=False,        # Windows 프록시 SSL 우회
        )
        # vton_img: 사람 사진 (ImageEditor 형식)
        # garm_img: 한복 이미지
        # is_checked=True: 자동 마스크 생성 (옷 영역만 교체, 얼굴·배경 보존)
        return client.predict(
            dict={
                "background": handle_file(str(person_path)),
                "layers": [],
                "composite": None,
            },
            garm_img=handle_file(str(garment_path)),
            garment_des=garment_desc,
            is_checked=True,       # 자동 마스크: 얼굴·머리·배경 보존
            is_checked_crop=False,
            denoise_steps=30,      # 품질과 속도의 균형
            seed=42,
            api_name="/tryon",
        )

    print("[fitting] ① IDM-VTON 가상 피팅 시도 (최대 3분 소요)...")
    try:
        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, _sync_call),
            timeout=180.0,
        )
        # result[0] = 피팅 결과 이미지 경로, result[1] = 마스크 이미지 경로
        fitted_path = Path(result[0])
        if fitted_path.exists() and fitted_path.stat().st_size > 1000:
            out_path = settings.UPLOAD_DIR / f"result_{uuid.uuid4()}.jpg"
            out_path.write_bytes(fitted_path.read_bytes())
            print(f"[fitting] ✅ IDM-VTON 성공 → {out_path.name}")
            return out_path
        print("[fitting] IDM-VTON: 결과 이미지가 없거나 비정상 크기")
    except asyncio.TimeoutError:
        print("[fitting] IDM-VTON 타임아웃 (3분 초과)")
    except Exception as e:
        print(f"[fitting] IDM-VTON 오류: {type(e).__name__}: {e}")

    return None


# ── ② OOTDiffusion (가상 피팅 폴백) ──────────────────────────
# HuggingFace Space: levihsu/OOTDiffusion

async def _ootd_try_on(
    person_path: Path,
    garment_path: Path,
) -> Optional[Path]:
    """OOTDiffusion: IDM-VTON 실패 시 폴백. 유사한 가상 피팅 품질."""
    try:
        from gradio_client import Client, handle_file
    except ImportError:
        return None

    def _sync_call():
        client = Client(
            "levihsu/OOTDiffusion",
            token=settings.HF_TOKEN or None,
            ssl_verify=False,        # Windows 프록시 SSL 우회
        )
        return client.predict(
            vton_img=handle_file(str(person_path)),
            garm_img=handle_file(str(garment_path)),
            n_samples=1,
            n_steps=20,
            image_scale=2.0,
            seed=-1,
            api_name="/process_dc",
        )

    print("[fitting] ② OOTDiffusion 가상 피팅 시도 (최대 3분 소요)...")
    try:
        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, _sync_call),
            timeout=180.0,
        )
        item = result[0]
        fitted_path = Path(item["image"] if isinstance(item, dict) else item)
        if fitted_path.exists() and fitted_path.stat().st_size > 1000:
            out_path = settings.UPLOAD_DIR / f"result_{uuid.uuid4()}.jpg"
            out_path.write_bytes(fitted_path.read_bytes())
            print(f"[fitting] ✅ OOTDiffusion 성공 → {out_path.name}")
            return out_path
        print("[fitting] OOTDiffusion: 결과 이미지 없음")
    except asyncio.TimeoutError:
        print("[fitting] OOTDiffusion 타임아웃")
    except Exception as e:
        print(f"[fitting] OOTDiffusion 오류: {type(e).__name__}: {e}")

    return None


# ── ③ FLUX.1-schnell (HuggingFace Inference API) ─────────────
# 텍스트→이미지. 진짜 피팅은 아니지만 한복 디자인 충실히 반영.
# HF_TOKEN 필요 (이미 .env에 있음).

async def _hf_flux_generate(hanbok: dict) -> Optional[Path]:
    """FLUX.1-schnell via HuggingFace Inference API. HF_TOKEN 필요."""
    if not settings.HF_TOKEN:
        print("[fitting] HF_TOKEN 미설정 → FLUX.1-schnell 건너뜀")
        return None

    title    = hanbok.get("title", "Korean hanbok")
    color    = hanbok.get("color", "")
    category = hanbok.get("category", "")

    prompt = (
        f"Professional full-body fashion photograph of a Korean person "
        f"wearing traditional Korean hanbok called '{title}'"
        + (f", {color} colors" if color else "")
        + (f", {category} style" if category else "")
        + ". Traditional Korean palace garden background, dancheong wooden architecture, "
        "soft natural daylight, elegant full-body pose, face clearly visible, "
        "4K photorealistic, highly detailed silk fabric texture."
    )

    print("[fitting] ③ FLUX.1-schnell (HuggingFace) 시도...")
    try:
        async with httpx.AsyncClient(verify=False, timeout=120) as http:
            resp = await http.post(
                "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
                headers={"Authorization": f"Bearer {settings.HF_TOKEN}"},
                json={
                    "inputs": prompt,
                    "parameters": {
                        "width":                768,
                        "height":               1024,
                        "num_inference_steps":  4,   # schnell은 4스텝으로 충분
                    },
                },
            )
            if resp.status_code == 200 and len(resp.content) > 2000:
                out_path = settings.UPLOAD_DIR / f"result_{uuid.uuid4()}.jpg"
                out_path.write_bytes(resp.content)
                print(f"[fitting] ✅ FLUX.1-schnell 성공 → {out_path.name}")
                return out_path
            print(f"[fitting] FLUX 실패: HTTP {resp.status_code} — {resp.text[:200]}")
    except Exception as e:
        print(f"[fitting] FLUX 오류: {type(e).__name__}: {e}")

    return None


# ── ④ Pollinations AI (최후 수단) ────────────────────────────
# 완전 무료, API키 불필요. 텍스트→이미지.

async def _pollinations_fallback(hanbok: dict) -> Optional[Path]:
    """Pollinations AI — API키 불필요, 완전 무료 최후 수단."""
    title    = hanbok.get("title", "traditional Korean hanbok")
    color    = hanbok.get("color", "")
    category = hanbok.get("category", "")

    prompt = (
        f"Photorealistic full-body portrait of a Korean person wearing "
        f"traditional {category + ' ' if category else ''}Korean hanbok '{title}'"
        + (f", {color} color" if color else "")
        + ". Traditional Korean palace garden background, "
        "soft natural lighting, professional fashion photography, full body shot, 4K"
    )
    url = (
        f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}"
        "?width=768&height=1024&nologo=true&model=flux"
    )
    print("[fitting] ④ Pollinations 폴백 시도...")

    try:
        async with httpx.AsyncClient(timeout=120, verify=False) as http:
            resp = await http.get(url)
            if resp.status_code == 200 and len(resp.content) > 2000:
                out_path = settings.UPLOAD_DIR / f"result_{uuid.uuid4()}.jpg"
                out_path.write_bytes(resp.content)
                print(f"[fitting] ✅ Pollinations 성공 → {out_path.name}")
                return out_path
            print(f"[fitting] Pollinations 실패: HTTP {resp.status_code}")
    except Exception as e:
        print(f"[fitting] Pollinations 오류: {e}")

    return None


# ── 이미지 생성 통합 ──────────────────────────────────────────

async def _generate_fitting_image(photo_path: Path, hanbok: dict) -> Optional[Path]:
    """
    가상 피팅 이미지 생성 통합 함수.

    한복에 image_url이 있으면:
      ① IDM-VTON → ② OOTDiffusion (얼굴·체형 보존 진짜 피팅)
    없거나 위 둘 실패 시:
      ③ FLUX.1-schnell → ④ Pollinations (텍스트 기반 생성)
    """
    hanbok_url    = hanbok.get("image_url")
    garment_path: Optional[Path] = None

    # 한복 이미지 다운로드 (진짜 가상 피팅에 필요)
    if hanbok_url:
        try:
            data, mime = await _fetch_url_bytes(hanbok_url)
            ext = ".png" if "png" in mime else ".jpg"
            garment_path = settings.UPLOAD_DIR / f"tmp_garment_{uuid.uuid4()}{ext}"
            garment_path.write_bytes(data)
            print(f"[fitting] 한복 이미지 준비: {garment_path.name} ({len(data):,} bytes)")
        except Exception as e:
            print(f"[fitting] 한복 이미지 다운로드 실패 (텍스트 기반으로 폴백): {e}")

    garment_desc = (
        f"Traditional Korean hanbok '{hanbok.get('title', '')}'"
        + (f", {hanbok['color']} color"    if hanbok.get("color")    else "")
        + (f", {hanbok['category']} style" if hanbok.get("category") else "")
    )

    result: Optional[Path] = None
    try:
        # 진짜 Virtual Try-On (한복 이미지 있을 때)
        if garment_path and garment_path.exists():
            result = await _idm_vton_try_on(photo_path, garment_path, garment_desc)
            if not result:
                result = await _ootd_try_on(photo_path, garment_path)

        # 텍스트 기반 폴백
        if not result:
            result = await _hf_flux_generate(hanbok)
        if not result:
            result = await _pollinations_fallback(hanbok)

    finally:
        # 임시 한복 이미지 파일 정리
        if garment_path and garment_path.exists():
            try:
                garment_path.unlink()
            except Exception:
                pass

    return result


# ── Gemini 텍스트: 인물 분석 + 스타일 추천 ──────────────────
# (텍스트 모델 gemini-2.5-flash 는 무료 티어 존재 → 그대로 사용)

async def _analyze_person(
    client: genai.Client, photo_bytes: bytes, mime_type: str
) -> str:
    prompt = (
        "이 사진 속 인물의 특징을 정확하게 분석해 주세요. "
        "다음 항목을 한 줄씩 반드시 답하세요:\n"
        "성별: (남성 또는 여성)\n"
        "나이대: (예: 20대, 30대)\n"
        "피부톤: (예: 밝은 편, 보통, 어두운 편)\n"
        "헤어: (예: 짧은 검은 머리, 긴 갈색 머리)\n"
        "얼굴형: (예: 갸름한, 둥근, 각진)\n"
        "추가 특징: (안경 착용, 수염 등 눈에 띄는 특징이 있으면 기록, 없으면 '없음')"
    )
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=[
            genai_types.Part.from_text(text=prompt),
            genai_types.Part.from_bytes(data=photo_bytes, mime_type=mime_type),
        ],
    )
    return response.text.strip()


async def _get_text_recommendation(
    client: genai.Client, photo_path: Path, hanbok: dict
) -> Optional[str]:
    photo_bytes = photo_path.read_bytes()
    mime_type   = _MIME_MAP.get(photo_path.suffix.lower(), "image/jpeg")

    try:
        person_info = await _analyze_person(client, photo_bytes, mime_type)
    except Exception as e:
        print(f"[fitting] 인물 분석 실패: {e}")
        person_info = "성별: 알 수 없음"

    prompt = (
        f"당신은 한복 전문 스타일리스트입니다.\n"
        f"[고객 정보]\n{person_info}\n\n"
        f"고객이 선택한 한복: '{hanbok['title']}'\n"
        f"한복 정보 — 색상: {hanbok.get('color', '')}, 카테고리: {hanbok.get('category', '')}\n\n"
        "위 고객 정보(특히 성별)를 반드시 고려하여, 이 한복이 어떻게 어울릴지 "
        "맞춤형 스타일 조언을 한국어로 2~3문장으로 친근하게 제공해주세요. "
        "남성 고객이라면 남성 한복 스타일링(바지·마고자·두루마기 등)을 중심으로 조언하세요."
    )
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=[
            genai_types.Part.from_text(text=prompt),
            genai_types.Part.from_bytes(data=photo_bytes, mime_type=mime_type),
        ],
    )
    return response.text


# ── API 엔드포인트 ────────────────────────────────────────────

@router.post("/upload-photo")
async def upload_photo(photo: UploadFile = File(...)):
    """사용자 사진 업로드"""
    _validate_image(photo)

    content = await photo.read()
    if len(content) / (1024 * 1024) > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"파일 크기가 {settings.MAX_UPLOAD_SIZE_MB}MB를 초과합니다.",
        )

    photo_id = str(uuid.uuid4())
    suffix   = Path(photo.filename).suffix.lower() if photo.filename else ".jpg"
    if suffix not in _MIME_MAP:
        suffix = ".jpg"
    save_path = settings.UPLOAD_DIR / f"{photo_id}{suffix}"
    save_path.write_bytes(content)

    return {
        "photo_id":   photo_id,
        "photo_path": str(save_path),
        "message":    "사진이 업로드되었습니다.",
    }


@router.post("/generate", response_model=FittingResult)
async def generate_fitting(
    hanbok_id: str = Form(...),
    photo_id:  str = Form(...),
):
    """
    AI 가상 피팅 실행.

    이미지 생성(IDM-VTON/OOTDiffusion/FLUX/Pollinations)과
    스타일 추천(Gemini 텍스트)을 병렬 처리.
    최대 3~5분 소요 가능 (HF Space 대기열에 따라).
    """
    hanbok     = _load_hanbok(hanbok_id)
    fitting_id = str(uuid.uuid4())[:8].upper()
    photo_path = _find_photo(photo_id)
    photo_url  = f"/uploads/{photo_path.name}"

    # 이미지 생성 (IDM-VTON → OOTDiffusion → FLUX → Pollinations)
    image_task = _generate_fitting_image(photo_path, hanbok)

    # 텍스트 스타일 추천 (Gemini 텍스트 모델, 무료 티어 사용 가능)
    if settings.GEMINI_API_KEY:
        _no_ssl = httpx.AsyncClient(verify=False, timeout=60.0)
        gemini_client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=genai_types.HttpOptions(httpx_async_client=_no_ssl),
        )
        text_task = _get_text_recommendation(gemini_client, photo_path, hanbok)
    else:
        print("[fitting] GEMINI_API_KEY 미설정 — 스타일 추천 건너뜀")
        text_task = asyncio.sleep(0)   # type: ignore[assignment]

    img_result, rec_result = await asyncio.gather(
        image_task, text_task, return_exceptions=True
    )

    result_image_url = None
    if isinstance(img_result, Exception):
        print(f"[fitting] 이미지 생성 최종 오류: {img_result}")
    elif img_result is not None:
        result_image_url = f"/uploads/{img_result.name}"

    ai_recommendation = None
    if isinstance(rec_result, Exception):
        print(f"[fitting] 텍스트 추천 오류: {rec_result}")
    elif isinstance(rec_result, str):
        ai_recommendation = rec_result

    return FittingResult(
        fitting_id=fitting_id,
        hanbok_id=hanbok_id,
        hanbok_name=hanbok["title"],
        status="completed",
        message=f"'{hanbok['title']}' 피팅이 완료되었습니다! 피팅 ID: {fitting_id}",
        ai_recommendation=ai_recommendation,
        result_image_url=result_image_url,
        photo_url=photo_url,
    )


@router.get("/result/{fitting_id}")
def get_fitting_result(fitting_id: str):
    return {"fitting_id": fitting_id, "status": "completed", "message": "피팅 결과를 확인하세요."}
