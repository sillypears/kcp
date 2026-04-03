import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db():
    conn = psycopg2.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", "5432")),
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASS", ""),
        database=os.getenv("PG_DB", "keyc"),
    )
    try:
        yield conn
    finally:
        conn.close()
