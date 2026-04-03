from fastapi import APIRouter, Depends, HTTPException
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor

from api.database import get_db
from api.schemas import BoxResponse, BoxCreate, BoxUpdate

router = APIRouter(prefix="/api/boxes", tags=["boxes"])


@router.get("/", response_model=List[BoxResponse])
def list_boxes(db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM boxes ORDER BY label")
    return cur.fetchall()


@router.get("/{box_id}", response_model=BoxResponse)
def get_box(box_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM boxes WHERE id = %s", (box_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Box not found")
    return row


@router.get("/{box_id}/keycaps")
def get_box_keycaps(box_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        "SELECT * FROM all_keycaps WHERE box_id = %s ORDER BY maker_name, sculpt",
        (box_id,),
    )
    return cur.fetchall()


@router.post("/", response_model=BoxResponse, status_code=201)
def create_box(data: BoxCreate, db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        """
        INSERT INTO boxes (label, name, maker_name, capacity, height, width, dedicated, allow_add)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
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
    new_id = cur.fetchone()["id"]
    db.commit()
    return get_box(new_id, db)


@router.put("/{box_id}", response_model=BoxResponse)
def update_box(
    box_id: int, data: BoxUpdate, db: psycopg2.extensions.connection = Depends(get_db)
):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id FROM boxes WHERE id = %s", (box_id,))
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
            fields.append(f"{field} = %s")
            params.append(val)

    if fields:
        params.append(box_id)
        cur.execute(f"UPDATE boxes SET {', '.join(fields)} WHERE id = %s", params)
        db.commit()

    return get_box(box_id, db)


@router.delete("/{box_id}", status_code=204)
def delete_box(box_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("DELETE FROM boxes WHERE id = %s", (box_id,))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Box not found")
    db.commit()
