import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Novel
from app.models.agent import AgentSession, AgentMessage
from app.models.user import User
from app.schemas import (
    AgentSessionCreate, AgentSessionOut, AgentSessionDetail,
    AgentMessageCreate, AgentMessageOut,
)
from app.modules.auth import get_current_user

router = APIRouter(tags=["agent-sessions"])


def _get_session_or_404(db: Session, session_id: int, user_id: int) -> AgentSession:
    session = db.get(AgentSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权操作此会话")
    return session


# ── Sessions ──────────────────────────────────────────

@router.get("/novels/{novel_id}/sessions", response_model=list[AgentSessionOut])
def list_sessions(
    novel_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    return (
        db.query(AgentSession)
        .filter(AgentSession.novel_id == novel_id)
        .order_by(AgentSession.updated_at.desc())
        .all()
    )


@router.post("/novels/{novel_id}/sessions", response_model=AgentSessionOut, status_code=201)
def create_session(
    novel_id: int,
    req: AgentSessionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    session = AgentSession(
        novel_id=novel_id,
        user_id=user.id,
        context_type=req.context_type,
        context_id=req.context_id,
        title=req.title,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=AgentSessionDetail)
def get_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_session_or_404(db, session_id, user.id)


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_session_or_404(db, session_id, user.id)
    db.delete(session)
    db.commit()


# ── Messages ──────────────────────────────────────────

@router.post("/sessions/{session_id}/messages", response_model=AgentMessageOut, status_code=201)
def create_message(
    session_id: int,
    req: AgentMessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_session_or_404(db, session_id, user.id)

    msg = AgentMessage(
        session_id=session_id,
        role=req.role,
        agent_name=req.agent_name,
        content=req.content,
        tokens=req.tokens,
        meta_json=req.meta_json,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/sessions/{session_id}/messages", response_model=list[AgentMessageOut])
def list_messages(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_session_or_404(db, session_id, user.id)
    return (
        db.query(AgentMessage)
        .filter(AgentMessage.session_id == session_id)
        .order_by(AgentMessage.id)
        .all()
    )
