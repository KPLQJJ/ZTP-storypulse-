from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.novel_group import NovelGroup
from app.models.user import User
from app.schemas import NovelGroupCreate, NovelGroupUpdate, NovelGroupOut
from app.modules.auth import get_current_user

router = APIRouter(prefix="/novel-groups", tags=["novel-groups"])


def _get_group_or_404(db: Session, group_id: int, user_id: int) -> NovelGroup:
    group = db.get(NovelGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="分组不存在")
    if group.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权操作此分组")
    return group


@router.get("", response_model=list[NovelGroupOut])
def list_groups(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(NovelGroup)
        .filter(NovelGroup.user_id == user.id)
        .order_by(NovelGroup.sort_order, NovelGroup.id)
        .all()
    )


@router.post("", response_model=NovelGroupOut, status_code=201)
def create_group(
    req: NovelGroupCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = NovelGroup(user_id=user.id, name=req.name.strip())
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.patch("/{group_id}", response_model=NovelGroupOut)
def update_group(
    group_id: int,
    req: NovelGroupUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = _get_group_or_404(db, group_id, user.id)
    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")
    for k, v in updates.items():
        setattr(group, k, v)
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = _get_group_or_404(db, group_id, user.id)
    db.delete(group)
    db.commit()
