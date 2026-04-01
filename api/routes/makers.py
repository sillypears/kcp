from fastapi import APIRouter, Depends, HTTPException
from typing import List
import mariadb

from api.database import get_db
from api.schemas import MakerResponse, MakerCreate

router = APIRouter(prefix="/api/makers", tags=["makers"])


@router.get("/", response_model=List[MakerResponse])
def list_makers(db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM makers ORDER BY maker_name")
    return cur.fetchall()


@router.get("/{maker_id}", response_model=MakerResponse)
def get_maker(maker_id: int, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM makers WHERE id = ?", (maker_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Maker not found")
    return row


@router.post("/", response_model=MakerResponse, status_code=201)
def create_maker(data: MakerCreate, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    try:
        cur.execute(
            """
            INSERT INTO makers (maker_name, maker_name_clean)
            VALUES (?, ?)
        """,
            (data.maker_name, data.maker_name_clean),
        )
        db.commit()
    except mariadb.IntegrityError:
        raise HTTPException(status_code=409, detail="Maker already exists")
    return get_maker(cur.lastrowid, db)


@router.delete("/{maker_id}", status_code=204)
def delete_maker(maker_id: int, db: mariadb.Connection = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("DELETE FROM makers WHERE id = ?", (maker_id,))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Maker not found")
    db.commit()
