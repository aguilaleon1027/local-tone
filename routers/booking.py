from fastapi import APIRouter, HTTPException
from models import BookingCreate
from db import get_db

router = APIRouter()


@router.post("/create", status_code=201)
def create_booking(data: BookingCreate):
    payload = {k: v for k, v in {
        "name": data.name,
        "phone": data.phone,
        "email": data.email,
        "booking_date": data.booking_date,
        "hanbok_id": data.hanbok_id,
    }.items() if v is not None}
    result = get_db().table("booking").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="예약 저장에 실패했습니다.")
    return result.data[0]
