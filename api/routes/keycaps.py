from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

from api.database import get_db
from api.schemas import KeycapResponse, KeycapCreate, KeycapUpdate, MoveKeycap

router = APIRouter(prefix="/api/keycaps", tags=["keycaps"])


@router.get("/", response_model=List[KeycapResponse])
def list_keycaps(
    box_id: Optional[int] = None,
    maker_id: Optional[int] = None,
    search: Optional[str] = None,
    db: psycopg2.extensions.connection = Depends(get_db),
):
    query = "SELECT * FROM all_keycaps WHERE 1=1"
    params = []
    if box_id is not None:
        query += " AND box_id = %s"
        params.append(box_id)
    if maker_id is not None:
        query += " AND maker_id = %s"
        params.append(maker_id)
    if search:
        query += " AND (sculpt LIKE %s OR maker_name LIKE %s OR colorway LIKE %s)"
        like = f"%{search}%"
        params.extend([like, like, like])
    query += " ORDER BY maker_name, sculpt"

    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute(query, params)
    return cur.fetchall()


@router.get("/{keycap_id}", response_model=KeycapResponse)
def get_keycap(keycap_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM all_keycaps WHERE id = %s", (keycap_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Keycap not found")
    return row


@router.post("/", response_model=KeycapResponse, status_code=201)
def create_keycap(
    data: KeycapCreate, db: psycopg2.extensions.connection = Depends(get_db)
):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        """
        INSERT INTO keycaps (maker_id, box_id, cell_x, cell_y, sculpt, colorway)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    """,
        (
            data.maker_id,
            data.box_id,
            data.cell_x,
            data.cell_y,
            data.sculpt,
            data.colorway,
        ),
    )
    new_id = cur.fetchone()["id"]
    db.commit()
    return get_keycap(new_id, db)


@router.put("/{keycap_id}", response_model=KeycapResponse)
def update_keycap(
    keycap_id: int,
    data: KeycapUpdate,
    db: psycopg2.extensions.connection = Depends(get_db),
):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id FROM keycaps WHERE id = %s", (keycap_id,))
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail="Keycap not found")

    fields = []
    params = []
    for field in ["maker_id", "box_id", "cell_x", "cell_y", "sculpt", "colorway"]:
        val = getattr(data, field)
        if val is not None:
            fields.append(f"{field} = %s")
            params.append(val)

    if fields:
        params.append(keycap_id)
        cur.execute(f"UPDATE keycaps SET {', '.join(fields)} WHERE id = %s", params)
        db.commit()

    return get_keycap(keycap_id, db)


@router.delete("/{keycap_id}", status_code=204)
def delete_keycap(keycap_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("DELETE FROM keycaps WHERE id = %s", (keycap_id,))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Keycap not found")
    db.commit()


@router.post("/move", response_model=KeycapResponse)
def move_keycap(data: MoveKeycap, db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        "UPDATE keycaps SET box_id = %s, cell_x = %s, cell_y = %s WHERE id = %s",
        (data.box_id, data.cell_x, data.cell_y, data.keycap_id),
    )
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Keycap not found")
    db.commit()
    return get_keycap(data.keycap_id, db)
