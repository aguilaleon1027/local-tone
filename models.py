from pydantic import BaseModel
from typing import Optional


class PriceRange(BaseModel):
    min: int
    max: int


class HanbokItem(BaseModel):
    id: str
    name: str
    name_en: str
    category: str
    subcategory: Optional[str] = None
    price_range: PriceRange
    colors: list[str]
    color_hex: list[str]
    gradient: str
    description: str
    occasions: list[str]
    featured: bool = False
    available: bool = True
    available_sizes: list[str]
    tags: list[str] = []


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
