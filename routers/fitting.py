import uuid
import asyncio
import httpx
import urllib.parse
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from google import genai
from google.genai import types as genai_types
from models import FittingResult
from config import settings
from db import get_db

router = APIRouter()

_MIME_MAP = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}
_ALLOWED_EXTS = tuple(_MIME_MAP.keys())


def _validate_image(file: UploadFile):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 허용: {', '.join(settings.ALLOWED_IMAGE_TYPES)}",
        )


def _load_hanbok(hanbok_id: str) -> dict:
    result = get_db().table("hanbok").select("*").eq("id", hanbok_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="선택한 한복을 찾을 수 없습니다.")
    return result.data


def _find_photo(photo_id: str) -> Path:
    for ext in _ALLOWED_EXTS:
        p = settings.UPLOAD_DIR / f"{photo_id}{ext}"
        if p.exists():
            return p
    raise HTTPException(status_code=404, detail="업로드된 사진을 찾을 수 없습니다.")


async def _fetch_url_bytes(url: str) -> tuple[bytes, str]:
    async with httpx.AsyncClient(timeout=20, verify=False) as http:
        resp = await http.get(url)
        resp.raise_for_status()
        mime = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        return resp.content, mime


async def _gemini_image_gen(client: genai.Client, photo_path: Path, hanbok: dict) -> Optional[Path]:
    photo_bytes = photo_path.read_bytes()
    mime_type = _MIME_MAP.get(photo_path.suffix.lower(), "image/jpeg")

    hanbok_parts: list = []
    if hanbok.get("image_url"):
        try:
            hanbok_bytes, hanbok_mime = await _fetch_url_bytes(hanbok["image_url"])
            hanbok_parts = [
                genai_types.Part.from_text(text="[참고 한복 이미지 — 이 한복을 인물에게 입히세요]"),
                genai_types.Part.from_bytes(data=hanbok_bytes, mime_type=hanbok_mime),
            ]
        except Exception as e:
            print(f"[fitting] 한복 이미지 다운로드 실패: {e}")

    prompt = (
        "이것은 가상 착의(virtual try-on) 작업입니다. "
        "첨부된 사진 속 인물의 얼굴·헤어·체형을 그대로 유지한 채, "
        f"현재 옷만 한복({hanbok.get('title', '')}, 색상: {hanbok.get('color', '')})으로 교체해주세요. "
        "배경은 한국 전통 궁궐 정원으로 설정해주세요."
    )
    contents = [
        genai_types.Part.from_text(text=prompt),
        genai_types.Part.from_bytes(data=photo_bytes, mime_type=mime_type),
        *hanbok_parts,
    ]

    for model_id in [
        "gemini-2.0-flash-exp-image-generation",
        "gemini-2.0-flash-preview-image-generation",
    ]:
        try:
            print(f"[fitting] Gemini 이미지 생성 시도: {model_id}")
            response = await client.aio.models.generate_content(
                model=model_id,
                contents=contents,
                config=genai_types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                ),
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    result_path = settings.UPLOAD_DIR / f"result_{uuid.uuid4()}.jpg"
                    result_path.write_bytes(part.inline_data.data)
                    print(f"[fitting] Gemini 이미지 저장 완료: {result_path.name}")
                    return result_path
            print(f"[fitting] {model_id}: IMAGE part 없음")
        except Exception as e:
            print(f"[fitting] {model_id} 실패: {e}")

    return None


async def _pollinations_fallback(hanbok: dict) -> Optional[Path]:
    prompt = (
        f"Photorealistic full-body portrait of a Korean person "
        f"wearing traditional Korean hanbok. "
        f"Hanbok: {hanbok.get('title', '')}, color {hanbok.get('color', '')}, "
        f"category {hanbok.get('category', '')}. "
        "Traditional Korean palace garden background, soft natural lighting, "
        "professional fashion photography, full body shot, high quality"
    )
    print("[fitting] Pollinations 폴백 시도...")
    url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}?width=768&height=1024&nologo=true&model=flux"

    async with httpx.AsyncClient(timeout=120, verify=False) as http:
        resp = await http.get(url)
        print(f"[fitting] Pollinations 응답 status: {resp.status_code}, bytes: {len(resp.content)}")
        if resp.status_code == 200 and resp.content:
            result_path = settings.UPLOAD_DIR / f"result_{uuid.uuid4()}.jpg"
            result_path.write_bytes(resp.content)
            print(f"[fitting] Pollinations 이미지 저장 완료: {result_path.name}")
            return result_path
    print("[fitting] Pollinations 실패")
    return None


async def _generate_fitting_image(client: genai.Client, photo_path: Path, hanbok: dict) -> Optional[Path]:
    try:
        result = await _gemini_image_gen(client, photo_path, hanbok)
        if result:
            return result
    except Exception as e:
        print(f"[fitting] Gemini 이미지 생성 오류: {e}")
    return await _pollinations_fallback(hanbok)


async def _analyze_person(client: genai.Client, photo_bytes: bytes, mime_type: str) -> str:
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


async def _get_text_recommendation(client: genai.Client, photo_path: Path, hanbok: dict) -> Optional[str]:
    photo_bytes = photo_path.read_bytes()
    mime_type = _MIME_MAP.get(photo_path.suffix.lower(), "image/jpeg")

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


@router.post("/upload-photo")
async def upload_photo(photo: UploadFile = File(...)):
    _validate_image(photo)

    content = await photo.read()
    if len(content) / (1024 * 1024) > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"파일 크기가 {settings.MAX_UPLOAD_SIZE_MB}MB를 초과합니다.",
        )

    photo_id = str(uuid.uuid4())
    suffix = Path(photo.filename).suffix.lower() if photo.filename else ".jpg"
    if suffix not in _MIME_MAP:
        suffix = ".jpg"
    save_path = settings.UPLOAD_DIR / f"{photo_id}{suffix}"
    save_path.write_bytes(content)

    return {"photo_id": photo_id, "photo_path": str(save_path), "message": "사진이 업로드되었습니다."}


@router.post("/generate", response_model=FittingResult)
async def generate_fitting(
    hanbok_id: str = Form(...),
    photo_id: str = Form(...),
):
    hanbok = _load_hanbok(hanbok_id)
    fitting_id = str(uuid.uuid4())[:8].upper()
    photo_path = _find_photo(photo_id)
    photo_url = f"/uploads/{photo_path.name}"

    if settings.GEMINI_API_KEY:
        gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        image_task = _generate_fitting_image(gemini_client, photo_path, hanbok)
        text_task = _get_text_recommendation(gemini_client, photo_path, hanbok)
    else:
        image_task = _pollinations_fallback(hanbok)
        text_task = asyncio.sleep(0)

    img_result, rec_result = await asyncio.gather(image_task, text_task, return_exceptions=True)

    result_image_url = None
    if isinstance(img_result, Exception):
        print(f"[fitting] 이미지 생성 오류: {img_result}")
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
