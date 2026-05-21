from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Novel
from app.models.worldbuilding import Worldbuilding
from app.models.user import User
from app.schemas import WorldbuildingCreate, WorldbuildingUpdate, WorldbuildingOut
from app.modules.auth import get_current_user

router = APIRouter(tags=["worldbuilding"])


def _get_entry_or_404(db: Session, entry_id: int, user_id: int) -> Worldbuilding:
    entry = db.get(Worldbuilding, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="世界观条目不存在")
    novel = db.get(Novel, entry.novel_id)
    if not novel or novel.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权操作")
    return entry


@router.get("/novels/{novel_id}/worldbuilding", response_model=list[WorldbuildingOut])
def list_worldbuilding(
    novel_id: int,
    category: str = Query(default=""),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    q = db.query(Worldbuilding).filter(Worldbuilding.novel_id == novel_id)
    if category:
        q = q.filter(Worldbuilding.category == category)
    return q.order_by(Worldbuilding.category, Worldbuilding.id).all()


@router.post("/novels/{novel_id}/worldbuilding", response_model=WorldbuildingOut, status_code=201)
def create_worldbuilding(
    novel_id: int,
    req: WorldbuildingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    entry = Worldbuilding(
        novel_id=novel_id,
        category=req.category.strip(),
        title=req.title.strip(),
        content=req.content,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/worldbuilding/{entry_id}", response_model=WorldbuildingOut)
def get_worldbuilding(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_entry_or_404(db, entry_id, user.id)


@router.patch("/worldbuilding/{entry_id}", response_model=WorldbuildingOut)
def update_worldbuilding(
    entry_id: int,
    req: WorldbuildingUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = _get_entry_or_404(db, entry_id, user.id)
    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")
    for k, v in updates.items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/worldbuilding/{entry_id}", status_code=204)
def delete_worldbuilding(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = _get_entry_or_404(db, entry_id, user.id)
    db.delete(entry)
    db.commit()
