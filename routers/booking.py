import resend
from fastapi import APIRouter, HTTPException
from models import BookingCreate
from config import settings

router = APIRouter()


@router.post("/create", status_code=201)
def create_booking(data: BookingCreate):
    if not settings.RESEND_API_KEY or not settings.NOTIFICATION_EMAIL:
        raise HTTPException(status_code=503, detail="이메일 전송이 설정되지 않았습니다.")

    resend.api_key = settings.RESEND_API_KEY

    rows = [
        ("이름 / Name", data.name),
        ("이메일 / Email", data.email or "—"),
        ("추가 연락수단 / Contact", data.phone or "—"),
        ("예약 날짜 / Date", data.booking_date or "—"),
        ("한복 / Hanbok", f"{data.hanbok_title} ({data.hanbok_id})" if data.hanbok_title else data.hanbok_id or "—"),
    ]
    table_rows = "".join(
        f"<tr><td style='padding:8px 16px;color:#666;font-size:13px;border-bottom:1px solid #f0f0f0'>{k}</td>"
        f"<td style='padding:8px 16px;color:#111;font-size:13px;font-weight:600;border-bottom:1px solid #f0f0f0'>{v}</td></tr>"
        for k, v in rows
    )
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e8e8">
      <div style="background:#111;padding:20px 24px">
        <p style="margin:0;color:#fff;font-size:11px;letter-spacing:0.15em;text-transform:uppercase">장금이 한복</p>
        <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:700">새 예약 요청</h1>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:8px 0">
        {table_rows}
      </table>
      <div style="padding:16px 24px;background:#f8f8f8;border-top:1px solid #e8e8e8">
        <p style="margin:0;font-size:11px;color:#999">장금이 한복 예약 알림 · 수원 화성 행궁</p>
      </div>
    </div>
    """

    try:
        resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": settings.NOTIFICATION_EMAIL,
            "subject": f"[장금이 한복] 새 예약 요청 — {data.name} / {data.booking_date or '날짜 미입력'}",
            "html": html,
        })
        print(f"[booking] 예약 알림 이메일 전송 완료 → {settings.NOTIFICATION_EMAIL}")
    except Exception as e:
        print(f"[booking] 이메일 전송 실패: {e}")
        raise HTTPException(status_code=500, detail="이메일 전송에 실패했습니다. 다시 시도해주세요.")

    return {"message": "예약 요청이 완료되었습니다."}
