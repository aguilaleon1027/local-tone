import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from config import settings
from db import get_db

db = get_db()
result = db.table("hanbok").select("id, title, image_url").limit(3).execute()

print("한복 데이터 (full URL):\n")
for row in result.data:
    print(f"  id    : {row['id']}")
    print(f"  title : {row['title']}")
    print(f"  url   : {row.get('image_url', 'NONE')}")
    print()
