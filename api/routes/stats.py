from fastapi import APIRouter, Depends
import psycopg2
from psycopg2.extras import RealDictCursor

from api.database import get_db

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/maker-counts")
def maker_counts(db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT m.id, m.maker_name, COUNT(k.id) AS sculpt_count
        FROM makers m
        LEFT JOIN keycaps k ON m.id = k.maker_id
        GROUP BY m.id, m.maker_name
        ORDER BY sculpt_count DESC, m.maker_name
    """)
    return cur.fetchall()


@router.get("/box-inventory")
def box_inventory(db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT b.id, b.label, b.name, b.capacity, b.height, b.width,
               b.dedicated, b.allow_add, b.maker_name,
               COUNT(k.id) AS current_count
        FROM boxes b
        LEFT JOIN keycaps k ON b.id = k.box_id
        GROUP BY b.id
        ORDER BY b.label
    """)
    return cur.fetchall()


@router.get("/overview")
def overview(db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT COUNT(*) AS total_keycaps FROM keycaps")
    total_keycaps = cur.fetchone()["total_keycaps"]
    cur.execute("SELECT COUNT(*) AS total_makers FROM makers")
    total_makers = cur.fetchone()["total_makers"]
    cur.execute("SELECT COUNT(*) AS total_boxes FROM boxes")
    total_boxes = cur.fetchone()["total_boxes"]
    return {
        "total_keycaps": total_keycaps,
        "total_makers": total_makers,
        "total_boxes": total_boxes,
    }
