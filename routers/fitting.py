import uuid
import asyncio
import json
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models import FittingResult
from config import settings

router = APIRouter()

_MIME_MAP = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def _validate_image(file: UploadFile):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 허용: {', '.join(settings.ALLOWED_IMAGE_TYPES)}",
        )


def _load_hanbok(hanbok_id: str) -> dict:
    with open(settings.CATALOG_PATH, encoding="utf-8") as f:
        data = json.load(f)
    for item in data["hanboks"]:
        if item["id"] == hanbok_id:
            return item
    raise HTTPException(status_code=404, detail="선택한 한복을 찾을 수 없습니다.")


def _find_photo(photo_id: str) -> Path:
    for f in settings.UPLOAD_DIR.iterdir():
        if f.stem == photo_id:
            return f
    raise HTTPException(status_code=404, detail="업로드된 사진을 찾을 수 없습니다.")


async def _analyze_person(client, photo_bytes: bytes, mime_type: str) -> str:
    """사진에서 성별·나이대·피부톤·얼굴 특징을 추출해 이미지 생성 프롬프트에 주입할 문자열 반환."""
    from google.genai import types

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
            types.Part.from_text(text=prompt),
            types.Part.from_bytes(data=photo_bytes, mime_type=mime_type),
        ],
    )
    return response.text.strip()


async def _gemini_recommend(photo_path: Path, hanbok: dict, person_info: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    photo_bytes = photo_path.read_bytes()
    mime_type = _MIME_MAP.get(photo_path.suffix.lower(), "image/jpeg")

    prompt = (
        f"당신은 한복 전문 스타일리스트입니다.\n"
        f"[고객 정보]\n{person_info}\n\n"
        f"고객이 선택한 한복: '{hanbok['name']}'\n"
        f"한복 정보 — 색상: {', '.join(hanbok['colors'])}, 설명: {hanbok['description']}, "
        f"어울리는 행사: {', '.join(hanbok['occasions'])}\n\n"
        "위 고객 정보(특히 성별)를 반드시 고려하여, 이 한복이 어떻게 어울릴지 "
        "맞춤형 스타일 조언을 한국어로 2~3문장으로 친근하게 제공해주세요. "
        "남성 고객이라면 남성 한복 스타일링(바지·마고자·두루마기 등)을 중심으로 조언하세요."
    )

    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=[
            types.Part.from_text(text=prompt),
            types.Part.from_bytes(data=photo_bytes, mime_type=mime_type),
        ],
    )
    return response.text


async def _gemini_generate_fitting_image(photo_path: Path, hanbok: dict, person_info: str) -> Optional[Path]:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    photo_bytes = photo_path.read_bytes()
    mime_type = _MIME_MAP.get(photo_path.suffix.lower(), "image/jpeg")

    # person_info에서 성별 한 줄만 추출해 프롬프트에 명시적으로 삽입
    gender_line = next(
        (line for line in person_info.splitlines() if "성별" in line),
        "성별: 알 수 없음",
    )

    prompt = (
        "【작업 정의】\n"
        "이것은 '가상 착의(virtual try-on)' 편집 작업입니다. "
        "새로운 인물을 생성하는 것이 아니라, 첨부된 사진 속 동일한 인물의 "
        "옷만 한복으로 교체하는 작업입니다.\n\n"

        "【인물 분석 결과】\n"
        f"{person_info}\n\n"

        "【절대 변경 금지 — 원본 사진과 100% 동일하게 유지】\n"
        "· 얼굴 전체: 눈·코·입·귀·턱선·얼굴형·피부톤·주름·점 등 모든 세부 특징\n"
        "· 헤어스타일 및 머리 색\n"
        "· 안경·귀걸이·시계 등 액세서리\n"
        f"· 성별 ({gender_line}) — 절대 변경 금지\n"
        "· 표정 및 시선 방향\n\n"

        "【변경 대상 — 오직 이것만 교체】\n"
        "· 현재 착용 중인 의상 전체를 아래 한복으로 교체\n"
        f"  한복 이름: {hanbok['name']}\n"
        f"  색상: {', '.join(hanbok['colors'])}\n"
        f"  스타일: {hanbok['description']}\n\n"

        "【전신이 없는 경우 처리】\n"
        f"· 얼굴·상반신 사진이라면 {gender_line}에 맞는 자연스러운 전신으로 확장하되, "
        "얼굴은 원본을 그대로 유지한 채 하반신과 한복을 자연스럽게 합성하세요.\n\n"

        "【배경】\n"
        "· 한국 전통 궁궐 정원 또는 밝고 깨끗한 스튜디오 배경\n\n"

        "핵심 원칙: 이 사진을 보는 사람이 '이 사람이 한복을 입었구나'라고 느껴야 하며, "
        "'얼굴이 바뀐 다른 사람이 한복을 입었다'는 느낌이 들면 안 됩니다."
    )

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[
            types.Part.from_text(text=prompt),
            types.Part.from_bytes(data=photo_bytes, mime_type=mime_type),
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
        ),
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.data:
            result_path = settings.UPLOAD_DIR / f"result_{uuid.uuid4()}.jpg"
            result_path.write_bytes(part.inline_data.data)
            return result_path
    return None


@router.post("/upload-photo")
async def upload_photo(photo: UploadFile = File(...)):
    _validate_image(photo)

    content = await photo.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"파일 크기가 {settings.MAX_UPLOAD_SIZE_MB}MB를 초과합니다.",
        )

    photo_id = str(uuid.uuid4())
    suffix = Path(photo.filename).suffix if photo.filename else ".jpg"
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

    ai_recommendation = None
    result_image_url = None

    if settings.GEMINI_API_KEY:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        photo_bytes = photo_path.read_bytes()
        mime_type = _MIME_MAP.get(photo_path.suffix.lower(), "image/jpeg")

        # 1단계: 성별·외형 분석 (이미지 생성 정확도에 필수)
        try:
            person_info = await _analyze_person(client, photo_bytes, mime_type)
        except Exception:
            person_info = "성별: 알 수 없음"

        # 2단계: 분석 결과를 주입해 추천 + 이미지 생성 병렬 실행
        results = await asyncio.gather(
            _gemini_recommend(photo_path, hanbok, person_info),
            _gemini_generate_fitting_image(photo_path, hanbok, person_info),
            return_exceptions=True,
        )
        rec, img_path = results

        if not isinstance(rec, Exception):
            ai_recommendation = rec
        if not isinstance(img_path, Exception) and img_path is not None:
            result_image_url = f"/uploads/{img_path.name}"
    else:
        await asyncio.sleep(settings.FITTING_MOCK_DELAY_SECONDS)

    return FittingResult(
        fitting_id=fitting_id,
        hanbok_id=hanbok_id,
        hanbok_name=hanbok["name"],
        status="completed",
        message=f"'{hanbok['name']}' 피팅이 완료되었습니다! 피팅 ID: {fitting_id}",
        ai_recommendation=ai_recommendation,
        result_image_url=result_image_url,
        photo_url=photo_url,
    )


@router.get("/result/{fitting_id}")
def get_fitting_result(fitting_id: str):
    return {
        "fitting_id": fitting_id,
        "status": "completed",
        "message": "피팅 결과를 확인하세요.",
    }
