from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import mariadb

from api.database import get_db
from api.schemas import KeycapResponse, KeycapCreate, KeycapUpdate, MoveKeycap

router = APIRouter(prefix="/api/keycaps", tags=["keycaps"])


@router.get("/", response_model=List[KeycapResponse])
def list_keycaps(
    box_id: Optional[int] = None,
    maker_id: Optional[int] = None,
    search: Optional[str] = None,
    db: mariadb.Connection = Depends(get_db),
):
    query = """
        SELECT k.id, k.maker_id, k.box_id, k.cell_x, k.cell_y, k.sculpt, k.colorway,
               m.maker_name, b.label
        FROM keycaps k
        LEFT JOIN makers m ON m.id = k.maker_id
        LEFT JOIN boxes b ON b.id = k.box_id
        WHERE 1=1
    """
    params = []
    if box_id is not None:
        query += " AND k.box_id = ?"
        params.append(box_id)
    if maker_id is not None:
        query += " AND k.maker_id = ?"
        params.append(maker_id)
    if search:
        query += " AND (k.sculpt LIKE ? OR m.maker_name LIKE ? OR k.colorway LIKE ?)"
        like = f"%{search}%"
        params.extend([like, like, like])
    query += " ORDER BY m.maker_name, k.sculpt"

    cur = db.cursor(dictionary=True)
    cur.execute(query, params)
    return cur.fetchall()


@router.get("/{keycap_id}", response_model=KeycapResponse)
def get_keycap(keycap_id: int, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        """
        SELECT k.id, k.maker_id, k.box_id, k.cell_x, k.cell_y, k.sculpt, k.colorway,
               m.maker_name, b.label
        FROM keycaps k
        LEFT JOIN makers m ON m.id = k.maker_id
        LEFT JOIN boxes b ON b.id = k.box_id
        WHERE k.id = ?
    """,
        (keycap_id,),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Keycap not found")
    return row


@router.post("/", response_model=KeycapResponse, status_code=201)
def create_keycap(data: KeycapCreate, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        """
        INSERT INTO keycaps (maker_id, box_id, cell_x, cell_y, sculpt, colorway)
        VALUES (?, ?, ?, ?, ?, ?)
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
    db.commit()
    return get_keycap(cur.lastrowid, db)


@router.put("/{keycap_id}", response_model=KeycapResponse)
def update_keycap(
    keycap_id: int, data: KeycapUpdate, db: mariadb.Connection = Depends(get_db)
):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id FROM keycaps WHERE id = ?", (keycap_id,))
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail="Keycap not found")

    fields = []
    params = []
    for field in ["maker_id", "box_id", "cell_x", "cell_y", "sculpt", "colorway"]:
        val = getattr(data, field)
        if val is not None:
            fields.append(f"{field} = ?")
            params.append(val)

    if fields:
        params.append(keycap_id)
        cur.execute(f"UPDATE keycaps SET {', '.join(fields)} WHERE id = ?", params)
        db.commit()

    return get_keycap(keycap_id, db)


@router.delete("/{keycap_id}", status_code=204)
def delete_keycap(keycap_id: int, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("DELETE FROM keycaps WHERE id = ?", (keycap_id,))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Keycap not found")
    db.commit()


@router.post("/move", response_model=KeycapResponse)
def move_keycap(data: MoveKeycap, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        "UPDATE keycaps SET box_id = ?, cell_x = ?, cell_y = ? WHERE id = ?",
        (data.box_id, data.cell_x, data.cell_y, data.keycap_id),
    )
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Keycap not found")
    db.commit()
    return get_keycap(data.keycap_id, db)
