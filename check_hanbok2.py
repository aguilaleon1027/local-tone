import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
from db import get_db
db = get_db()
r = db.table("hanbok").select("id, title, image_url").ilike("title", "%2%").execute()
for row in r.data:
    print(f"id={row['id']}  title={row['title']}  url={row.get('image_url','')}")
