from fastapi import APIRouter, Depends, HTTPException
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor
import psycopg2.errors

from api.database import get_db
from api.schemas import MakerResponse, MakerCreate

router = APIRouter(prefix="/api/makers", tags=["makers"])


@router.get("/", response_model=List[MakerResponse])
def list_makers(db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM makers ORDER BY maker_name")
    return cur.fetchall()


@router.get("/{maker_id}", response_model=MakerResponse)
def get_maker(maker_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM makers WHERE id = %s", (maker_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Maker not found")
    return row


@router.post("/", response_model=MakerResponse, status_code=201)
def create_maker(
    data: MakerCreate, db: psycopg2.extensions.connection = Depends(get_db)
):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            """
            INSERT INTO makers (maker_name, maker_name_clean)
            VALUES (%s, %s)
            RETURNING id
        """,
            (data.maker_name, data.maker_name_clean),
        )
        new_id = cur.fetchone()["id"]
        db.commit()
        return get_maker(new_id, db)
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Maker already exists")


@router.delete("/{maker_id}", status_code=204)
def delete_maker(maker_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    cur.execute("DELETE FROM makers WHERE id = %s", (maker_id,))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Maker not found")
    db.commit()
