import mariadb
import os
from dotenv import load_dotenv

load_dotenv(".env.production")

conn = mariadb.connect(
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASS"),
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT")),
    database=os.getenv("DB_SCHEMA"),
)
cur = conn.cursor(dictionary=True)

cur.execute("SELECT id, width FROM boxes")
boxes = {b["id"]: b["width"] or 9 for b in cur.fetchall()}

cur.execute(
    "SELECT id, box_id FROM keycaps WHERE box_id IS NOT NULL ORDER BY box_id, id"
)
caps = cur.fetchall()

updates = []
box_counts = {}
for cap in caps:
    bid = cap["box_id"]
    width = boxes.get(bid, 9)
    idx = box_counts.get(bid, 0)
    cell_x = idx % width
    cell_y = idx // width
    updates.append((cell_x, cell_y, cap["id"]))
    box_counts[bid] = idx + 1

cur.executemany("UPDATE keycaps SET cell_x = ?, cell_y = ? WHERE id = ?", updates)
conn.commit()
print(f"Updated {len(updates)} keycaps with cell positions")
conn.close()
