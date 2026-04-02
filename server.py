from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
import uvicorn
from dotenv import load_dotenv

from api.routes import keycaps, boxes, makers, stats

load_dotenv(".env.production", override=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Artisan Whisperer", lifespan=lifespan)

app.include_router(keycaps.router)
app.include_router(boxes.router)
app.include_router(makers.router)
app.include_router(stats.router)

frontend_dist = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "frontend", "dist"
)

if os.path.isdir(frontend_dist):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(frontend_dist, "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:

    @app.get("/")
    async def root():
        return {
            "message": "API running. Build the frontend with: cd frontend && npm run build"
        }


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host=os.getenv("HOSTNAME", "0.0.0.0"),
        port=int(os.getenv("PORT", "6001")),
        reload=True,
    )
