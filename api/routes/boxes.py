from fastapi import APIRouter, Depends, HTTPException
from typing import List
import mariadb

from api.database import get_db
from api.schemas import BoxResponse, BoxCreate, BoxUpdate

router = APIRouter(prefix="/api/boxes", tags=["boxes"])


@router.get("/", response_model=List[BoxResponse])
def list_boxes(db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM boxes ORDER BY label")
    return cur.fetchall()


@router.get("/{box_id}", response_model=BoxResponse)
def get_box(box_id: int, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM boxes WHERE id = ?", (box_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Box not found")
    return row


@router.get("/{box_id}/keycaps")
def get_box_keycaps(box_id: int, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        """
        SELECT k.id, k.maker_id, k.box_id, k.sculpt, k.colorway,
               m.maker_name, b.label
        FROM keycaps k
        LEFT JOIN makers m ON m.id = k.maker_id
        LEFT JOIN boxes b ON b.id = k.box_id
        WHERE k.box_id = ?
        ORDER BY m.maker_name, k.sculpt
    """,
        (box_id,),
    )
    return cur.fetchall()


@router.post("/", response_model=BoxResponse, status_code=201)
def create_box(data: BoxCreate, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        """
        INSERT INTO boxes (label, name, maker_name, capacity, height, width, dedicated, allow_add)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """,
        (
            data.label,
            data.name,
            data.maker_name,
            data.capacity,
            data.height,
            data.width,
            data.dedicated,
            data.allow_add,
        ),
    )
    db.commit()
    return get_box(cur.lastrowid, db)


@router.put("/{box_id}", response_model=BoxResponse)
def update_box(box_id: int, data: BoxUpdate, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id FROM boxes WHERE id = ?", (box_id,))
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail="Box not found")

    fields = []
    params = []
    for field in [
        "name",
        "maker_name",
        "capacity",
        "height",
        "width",
        "dedicated",
        "allow_add",
    ]:
        val = getattr(data, field)
        if val is not None:
            fields.append(f"{field} = ?")
            params.append(val)

    if fields:
        params.append(box_id)
        cur.execute(f"UPDATE boxes SET {', '.join(fields)} WHERE id = ?", params)
        db.commit()

    return get_box(box_id, db)


@router.delete("/{box_id}", status_code=204)
def delete_box(box_id: int, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("DELETE FROM boxes WHERE id = ?", (box_id,))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Box not found")
    db.commit()
