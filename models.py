from pydantic import BaseModel
from typing import Optional


class HanbokItem(BaseModel):
    id: str
    title: str
    category: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    image_url: str
    is_available: bool = True
    created_at: Optional[str] = None


class FittingRequest(BaseModel):
    hanbok_id: str
    user_photo_path: str


class FittingResult(BaseModel):
    fitting_id: str
    hanbok_id: str
    hanbok_name: str
    status: str
    message: str
    result_image_url: Optional[str] = None
    ai_recommendation: Optional[str] = None
    photo_url: Optional[str] = None


class BookingCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    booking_date: Optional[str] = None
    hanbok_id: Optional[str] = None
