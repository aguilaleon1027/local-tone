import json
from fastapi import APIRouter, HTTPException, Query
from models import HanbokItem
from config import settings

router = APIRouter()


def load_catalog() -> dict:
    with open(settings.CATALOG_PATH, encoding="utf-8") as f:
        return json.load(f)


@router.get("/catalog", response_model=list[HanbokItem])
def get_catalog(
    category: str = Query(default="all", description="카테고리 필터"),
    featured_only: bool = Query(default=False),
    available_only: bool = Query(default=True),
):
    data = load_catalog()
    items = data["hanboks"]

    if available_only:
        items = [h for h in items if h["available"]]
    if featured_only:
        items = [h for h in items if h["featured"]]
    if category and category != "all":
        items = [h for h in items if h["category"] == category]

    return items


@router.get("/categories")
def get_categories():
    data = load_catalog()
    return data["categories"]


@router.get("/featured", response_model=list[HanbokItem])
def get_featured():
    data = load_catalog()
    return [h for h in data["hanboks"] if h["featured"] and h["available"]]


@router.get("/{hanbok_id}", response_model=HanbokItem)
def get_hanbok(hanbok_id: str):
    data = load_catalog()
    for item in data["hanboks"]:
        if item["id"] == hanbok_id:
            return item
    raise HTTPException(status_code=404, detail="한복을 찾을 수 없습니다.")
