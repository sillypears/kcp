from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
import re
import uvicorn
from dotenv import load_dotenv

from api.routes import keycaps, boxes, makers, stats

load_dotenv(".env.production", override=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Waste of Time Backend", lifespan=lifespan)

app.include_router(keycaps.router)
app.include_router(boxes.router)
app.include_router(makers.router)
app.include_router(stats.router)

frontend_dist = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "frontend", "dist"
)

if os.path.isdir(frontend_dist):
    # Serve manifest directly before static mount
    @app.get("/manifest.webmanifest")
    async def serve_manifest():
        return FileResponse(
            os.path.join(frontend_dist, "manifest.webmanifest"),
            media_type="application/manifest+json",
        )

    @app.get("/sw.js")
    async def serve_sw():
        return FileResponse(os.path.join(frontend_dist, "sw.js"))

    @app.get("/registerSW.js")
    async def serve_reg_sw():
        return FileResponse(os.path.join(frontend_dist, "registerSW.js"))

    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        file_path = os.path.join(frontend_dist, path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
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
