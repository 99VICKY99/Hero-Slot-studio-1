"""Route registry. Import all routers and expose them as a list.

`backend/main.py` iterates this list and `include_router`s each entry.
Adding a new endpoint = add a module and append its router here.
"""

from __future__ import annotations

from fastapi import APIRouter

from backend.routes.fetch_site import router as fetch_site_router
from backend.routes.health import router as health_router

all_routers: list[APIRouter] = [
    health_router,
    fetch_site_router,
]
