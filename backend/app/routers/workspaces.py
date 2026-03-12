from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Paper, User, Workspace
from app.schemas.workspace import PaperCreate, PaperRead, WorkspaceCreate, WorkspaceRead
from app.services.auth import get_current_user

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=list[WorkspaceRead])
def list_workspaces(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(Workspace).filter(Workspace.owner_id == current_user.id).all()


@router.post("", response_model=WorkspaceRead)
def create_workspace(
    payload: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = Workspace(
        name=payload.name, description=payload.description, owner_id=current_user.id
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.get("/{workspace_id}/papers", response_model=list[PaperRead])
def list_papers(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = _get_workspace(db, workspace_id, current_user.id)
    return workspace.papers


@router.post("/{workspace_id}/papers", response_model=PaperRead)
def add_paper(
    workspace_id: int,
    payload: PaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_workspace(db, workspace_id, current_user.id)
    paper = Paper(workspace_id=workspace_id, **payload.model_dump())
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper


def _get_workspace(db: Session, workspace_id: int, user_id: int) -> Workspace:
    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == workspace_id, Workspace.owner_id == user_id)
        .first()
    )
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace
