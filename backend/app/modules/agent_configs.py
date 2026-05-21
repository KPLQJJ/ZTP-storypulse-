from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Novel
from app.models.agent import AgentConfig
from app.models.user import User
from app.schemas import AgentConfigUpsert, AgentConfigOut
from app.modules.auth import get_current_user

router = APIRouter(tags=["agent-configs"])


@router.get("/novels/{novel_id}/agent-configs", response_model=list[AgentConfigOut])
def list_agent_configs(
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
        db.query(AgentConfig)
        .filter(AgentConfig.novel_id == novel_id)
        .order_by(AgentConfig.agent_role)
        .all()
    )


@router.put("/novels/{novel_id}/agent-configs", response_model=AgentConfigOut)
def upsert_agent_config(
    novel_id: int,
    req: AgentConfigUpsert,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    existing = (
        db.query(AgentConfig)
        .filter(
            AgentConfig.novel_id == novel_id,
            AgentConfig.agent_role == req.agent_role,
        )
        .first()
    )

    if existing:
        existing.model_id = req.model_id
        db.commit()
        db.refresh(existing)
        return existing

    config = AgentConfig(
        novel_id=novel_id,
        agent_role=req.agent_role,
        model_id=req.model_id,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


@router.delete("/novels/{novel_id}/agent-configs/{agent_role}", status_code=204)
def delete_agent_config(
    novel_id: int,
    agent_role: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    config = (
        db.query(AgentConfig)
        .filter(
            AgentConfig.novel_id == novel_id,
            AgentConfig.agent_role == agent_role,
        )
        .first()
    )
    if not config:
        raise HTTPException(status_code=404, detail="Agent 配置不存在")
    db.delete(config)
    db.commit()
