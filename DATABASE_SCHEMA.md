# Database Schema

## Database: keyc (PostgreSQL)

## Table: boxes

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PRIMARY KEY, DEFAULT nextval('boxes_id_seq') |
| label | character varying(50) | NOT NULL, UNIQUE |
| name | character varying(255) | |
| maker_name | character varying(255) | |
| capacity | integer | |
| height | integer | DEFAULT 9 |
| width | integer | DEFAULT 9 |
| dedicated | boolean | DEFAULT false |
| allow_add | boolean | DEFAULT true |
| allow_duplicates | boolean | DEFAULT false |

## Table: makers

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PRIMARY KEY, DEFAULT nextval('makers_id_seq') |
| maker_name | character varying(255) | NOT NULL, UNIQUE |
| maker_name_clean | character varying(255) | |
| instagram | character varying(255) | |
| city | character varying(100) | |
| state | character varying(50) | |
| country | character varying(10) | |
| first_name | character varying(50) | |
| state_code | character varying(3) | |

## Table: keycaps

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PRIMARY KEY, DEFAULT nextval('keycaps_id_seq') |
| maker_id | integer | FOREIGN KEY → makers(id) |
| box_id | integer | FOREIGN KEY → boxes(id) |
| cell_x | integer | |
| cell_y | integer | |
| sculpt | character varying(255) | NOT NULL |
| sculpt_clean | character varying(255) | |
| colorway | character varying(255) | |

- Unique constraint on `(maker_id, sculpt, colorway)`

## View: all_keycaps

```sql
SELECT 
    k.id AS id,
    k.maker_id AS maker_id,
    m.maker_name AS maker_name,
    k.collab_id AS collab_id,
    c.maker_name AS collab_name,
    k.sculpt AS sculpt,
    CONCAT(m.maker_name_clean, REPLACE(k.sculpt, ' ', '_')) AS unique_id,
    k.colorway AS colorway,
    k.box_id AS box_id,
    b.label AS label,
    k.cell_x AS cell_x,
    k.cell_y AS cell_y
FROM keycaps k
LEFT JOIN makers m ON m.id = k.maker_id
LEFT JOIN makers c ON c.id = k.collab_id
LEFT JOIN boxes b ON b.id = k.box_id;
```
