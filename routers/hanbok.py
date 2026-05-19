from fastapi import APIRouter, HTTPException, Query
from models import HanbokItem
from db import get_db

router = APIRouter()


@router.get("/catalog", response_model=list[HanbokItem])
def get_catalog(
    category: str = Query(default="all", description="카테고리 필터"),
    available_only: bool = Query(default=True),
):
    q = get_db().table("hanbok").select("*")
    if available_only:
        q = q.eq("is_available", True)
    if category and category != "all":
        q = q.eq("category", category)
    return q.execute().data


@router.get("/categories")
def get_categories():
    data = get_db().table("hanbok").select("category").execute().data
    cats = sorted({row["category"] for row in data if row.get("category")})
    return [{"id": "all", "name": "전체"}] + [{"id": c, "name": c} for c in cats]


@router.get("/featured", response_model=list[HanbokItem])
def get_featured():
    return get_db().table("hanbok").select("*").eq("is_available", True).limit(6).execute().data


@router.get("/{hanbok_id}", response_model=HanbokItem)
def get_hanbok(hanbok_id: str):
    result = get_db().table("hanbok").select("*").eq("id", hanbok_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="한복을 찾을 수 없습니다.")
    return result.data
