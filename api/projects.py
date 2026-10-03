"""
api/projects.py — CRUD for projects (stub for Week 2, implemented in Week 4).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
async def list_projects():
    # TODO Week 4: query Supabase, filter by user, search/sort
    return {"message": "list_projects — coming in Week 4"}


@router.post("/")
async def create_project():
    # TODO Week 4
    return {"message": "create_project — coming in Week 4"}
