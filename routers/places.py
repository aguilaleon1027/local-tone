import asyncio
import httpx
from fastapi import APIRouter, HTTPException, Query
from config import settings

router = APIRouter()

SHOP_LNG = 127.01438  # 장금이 한복 경도
SHOP_LAT = 37.28421   # 장금이 한복 위도
RADIUS   = 3000       # 장안문 포함 행궁동 일대 (3 km)

CATEGORY_CODES: dict[str, str] = {
    "맛집":  "FD6",
    "카페":  "CE7",
    "관광지": "AT4",
}

KEYWORD_QUERIES: dict[str, str] = {
    "쇼핑": "수원 행궁 기념품",
}


def _doc_to_place(doc: dict) -> dict:
    return {
        "title":       doc["place_name"],
        "category":    doc.get("category_name", "").split(" > ")[-1],
        "address":     doc.get("address_name", ""),
        "roadAddress": doc.get("road_address_name", ""),
        "telephone":   doc.get("phone", ""),
        "link":        doc.get("place_url", ""),
        "distance":    doc.get("distance", ""),
        "lat":         float(doc["y"]),
        "lng":         float(doc["x"]),
    }


@router.get("/nearby")
async def get_nearby_places(
    category: str   = Query(default="맛집"),
    lat:      float = Query(default=SHOP_LAT),
    lng:      float = Query(default=SHOP_LNG),
):
    if not settings.KAKAO_REST_API_KEY:
        raise HTTPException(status_code=503, detail="카카오 REST API 키가 설정되지 않았습니다.")

    headers     = {"Authorization": f"KakaoAK {settings.KAKAO_REST_API_KEY}"}
    base_params = {"x": lng, "y": lat, "radius": RADIUS, "size": 15, "sort": "distance"}

    async with httpx.AsyncClient(timeout=15, verify=False) as client:
        if category in CATEGORY_CODES:
            tasks = [
                client.get(
                    "https://dapi.kakao.com/v2/local/search/category.json",
                    params={**base_params, "category_group_code": CATEGORY_CODES[category], "page": p},
                    headers=headers,
                )
                for p in range(1, 4)  # 3페이지 동시 → 최대 45개
            ]
        else:
            query = KEYWORD_QUERIES.get(category, f"수원 {category}")
            tasks = [
                client.get(
                    "https://dapi.kakao.com/v2/local/search/keyword.json",
                    params={**base_params, "query": query, "page": p},
                    headers=headers,
                )
                for p in range(1, 4)
            ]

        responses = await asyncio.gather(*tasks, return_exceptions=True)

    documents: list[dict] = []
    seen_ids:  set[str]   = set()
    for resp in responses:
        if isinstance(resp, Exception):
            continue
        if resp.status_code != 200:
            continue
        for doc in resp.json().get("documents", []):
            pid = doc.get("id", "")
            if pid and pid not in seen_ids:
                seen_ids.add(pid)
                documents.append(doc)

    return [_doc_to_place(doc) for doc in documents]
