from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).parent


class Settings(BaseSettings):
    APP_NAME: str = "장금이 한복"
    APP_NAME_EN: str = "Janggeum Hanbok"
    APP_DESCRIPTION: str = "AI 가상 피팅으로 나만의 한복을 발견하세요"
    VERSION: str = "1.0.0"

    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    STATIC_DIR: Path = BASE_DIR / "static"

    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]

    FITTING_MOCK_DELAY_SECONDS: float = 2.5

    GEMINI_API_KEY: str = ""
    # 텍스트 분석·추천용 모델 (인물 분석, 스타일 추천)
    # gemini-2.0-flash → 2026-06-01 종료. gemini-3.5-flash 로 마이그레이션
    GEMINI_MODEL: str = "gemini-3.5-flash"
    HF_TOKEN: str = ""
    FASHN_API_KEY: str = ""          # Fashn.ai Virtual Try-On API (https://fashn.ai)

    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    RESEND_API_KEY: str = ""
    NOTIFICATION_EMAIL: str = ""   # 예약 알림을 받을 이메일 주소

    KAKAO_REST_API_KEY: str = ""  # 카카오 REST API 키 (백엔드 장소 검색용)
    # 프론트엔드 지도용 JavaScript 키는 .env의 VITE_KAKAO_MAP_KEY 에 설정

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"   # VITE_ 등 미정의 환경변수 무시


settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
