from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Paper, User, Workspace
from app.schemas.workspace import SearchResult
from app.services.auth import get_current_user
from app.services.search import search_arxiv

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=list[SearchResult])
async def search_papers(
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    return await search_arxiv(q)


@router.post("/import/{workspace_id}", response_model=SearchResult)
async def import_paper(
    workspace_id: int,
    paper: SearchResult,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == workspace_id, Workspace.owner_id == current_user.id)
        .first()
    )
    if workspace is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Workspace not found")

    stored_paper = Paper(workspace_id=workspace_id, **paper.model_dump())
    db.add(stored_paper)
    db.commit()
    return paper
