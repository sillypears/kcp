# Artisan Whisperer - Agent Instructions

## Project Overview
Keycap collection organizer. Shows artisan keycaps arranged in physical box grids, with drag-and-drop to move caps between boxes and within boxes. Unboxed keycaps (no `box_id`) are displayed in a section below all boxes, where they can be dragged into box grids.

## Tech Stack
- **Backend**: FastAPI + PostgreSQL (psycopg2)
- **Frontend**: React + Vite, served by FastAPI from `frontend/dist/`
- **Env**: `python-dotenv` loads `.env.production` (has DB creds, ports)

## Database Schema
All tables use `id` as auto-increment PK (NOT `box_id`/`keycap_id`/`maker_id`).

### `boxes`
- `id`, `label` (unique), `name`, `maker_name`, `capacity`, `height`, `width`
- `dedicated` (boolean), `allow_add` (boolean), `allow_duplicates` (boolean)

### `makers`
- `id`, `maker_name` (unique), `maker_name_clean`
- `instagram`, `city`, `state`, `country`, `first_name`, `state_code`

### `keycaps`
- `id`, `maker_id` (FK→makers.id), `box_id` (FK→boxes.id)
- `collab_id` (FK→makers.id) — collaborator maker
- `cell_x` (int), `cell_y` (int) — grid position within box
- `sculpt`, `sculpt_clean`, `colorway`
- Unique constraint on `(maker_id, sculpt, colorway)`

### `all_keycaps` (view)
- Joins keycaps + makers + boxes, returns `id`, `maker_id`, `maker_name`, `collab_id`, `collab_name`, `sculpt`, `unique_id`, `colorway`, `box_id`, `label`, `cell_x`, `cell_y`

## File Structure
```
server.py                    # FastAPI app + static file serving + dotenv loading
api/
  database.py                # get_db() generator, reads env vars at call time
  schemas.py                 # Pydantic models (KeycapResponse uses `id`, BoxResponse has `allow_duplicates`)
  routes/
    keycaps.py               # CRUD + /move endpoint (requires box_id, cell_x, cell_y)
    boxes.py                 # CRUD + /{box_id}/keycaps
    makers.py                # CRUD
    stats.py                 # /maker-counts, /box-inventory, /overview
frontend/
  src/
    App.jsx                  # Main app: grid rendering with cell_x/cell_y positioning
    api.js                   # API client (moveKeycap takes keycap_id, box_id, cell_x, cell_y)
    index.css                # Dark theme styles
  dist/                      # Built frontend (includes PWA manifest, service worker)
  vite.config.js            # PWA config via vite-plugin-pwa
```

## Key Implementation Details

### DB Connection
- `api/database.py` reads env vars **inside** `get_db()` (not at module level) so dotenv loads first
- Uses `cursor(dictionary=True)` — rows are dicts, no `dict(r)` wrapping needed
- Env vars: `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `DB_SCHEMA`

### Cell Positioning
- Each box has `height` × `width` grid cells
- `cell_x` = column (0 to width-1), `cell_y` = row (0 to height-1)
- When moving a cap, both `cell_x` and `cell_y` must be set
- Caps with null cell_x/cell_y won't appear in the grid (they need positions assigned)
- `assign_cell_positions.py` — one-time script that fills null positions by iterating caps per box

### Move Endpoint
- `POST /api/keycaps/move` — body: `{keycap_id, box_id, cell_x, cell_y}`
- All four fields required
- Setting `box_id` to `null` moves the keycap to the unboxed section (clears cell_x and cell_y)

### Frontend Grid
- Renders `height` rows × `width` columns per box
- Finds cap at each cell via `boxCaps.find(c => c.cell_x === x && c.cell_y === y)`
- Drag from any filled cell → drop on any empty cell → updates position
- Click empty cell while a cap is selected → moves cap there
- MoveModal (from keycap detail) defaults to `cell_x=0, cell_y=0`

### Unboxed Keycaps
- Keycaps with `box_id = null` render in a flex-wrapping grid below all boxes
- Draggable from unboxed section into any empty box cell
- Boxes highlight as drop targets when an unboxed cap is being dragged

## Running

### Production
```bash
cd frontend && npm run build
python server.py    # reads .env.production, serves on PORT/HOSTNAME
```

### Development
```bash
# Terminal 1
python server.py

# Terminal 2 (hot reload, proxies /api to :3000)
cd frontend && npm run dev
```

## Env Vars (.env.production)
- `DB_HOST=192.168.1.10`, `DB_PORT=3307`, `DB_USER=blap`, `DB_PASS=...`, `DB_SCHEMA=keyc`
- `PORT=3000`, `HOSTNAME=0.0.0.0`

## Notes
- `.env.production` is in `.gitignore` — do NOT commit it
- The original `main.py` is a CLI tool for suggesting cap reorganization (not web-related)
- `caps.csv` was the original import source; inserts were generated via `generate_inserts.py`
- PWA (Progressive Web App) enabled via vite-plugin-pwa — users can "Add to Home Screen" on mobile
- Service worker requires HTTPS (or localhost) to register
