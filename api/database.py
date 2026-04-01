import os
import mariadb


def get_db():
    conn = mariadb.connect(
        user=os.getenv("DB_USER", "blap"),
        password=os.getenv("DB_PASS", ""),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_SCHEMA", "box_organizer"),
    )
    try:
        yield conn
    finally:
        conn.close()
