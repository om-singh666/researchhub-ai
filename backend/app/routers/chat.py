from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import ChatMessage, User, Workspace
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.auth import get_current_user
from app.services.research_ai import generate_answer

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/{workspace_id}", response_model=ChatResponse)
def chat_with_workspace(
    workspace_id: int,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == workspace_id, Workspace.owner_id == current_user.id)
        .first()
    )
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    user_message = ChatMessage(
        workspace_id=workspace.id, role="user", content=payload.message
    )
    db.add(user_message)

    answer, citations = generate_answer(payload.message, workspace.papers)
    assistant_message = ChatMessage(
        workspace_id=workspace.id, role="assistant", content=answer
    )
    db.add(assistant_message)
    db.commit()

    return ChatResponse(answer=answer, citations=citations)
