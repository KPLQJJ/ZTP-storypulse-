from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Novel
from app.models.character import Character
from app.models.user import User
from app.schemas import CharacterCreate, CharacterUpdate, CharacterOut
from app.modules.auth import get_current_user

router = APIRouter(tags=["characters"])


def _get_character_or_404(db: Session, char_id: int, user_id: int) -> Character:
    char = db.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")
    novel = db.get(Novel, char.novel_id)
    if not novel or novel.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权操作")
    return char


@router.get("/novels/{novel_id}/characters", response_model=list[CharacterOut])
def list_characters(
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
        db.query(Character)
        .filter(Character.novel_id == novel_id)
        .order_by(Character.id)
        .all()
    )


@router.post("/novels/{novel_id}/characters", response_model=CharacterOut, status_code=201)
def create_character(
    novel_id: int,
    req: CharacterCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    char = Character(
        novel_id=novel_id,
        name=req.name.strip(),
        description=req.description,
        attributes=req.attributes,
    )
    db.add(char)
    db.commit()
    db.refresh(char)
    return char


@router.get("/characters/{character_id}", response_model=CharacterOut)
def get_character(
    character_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_character_or_404(db, character_id, user.id)


@router.patch("/characters/{character_id}", response_model=CharacterOut)
def update_character(
    character_id: int,
    req: CharacterUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    char = _get_character_or_404(db, character_id, user.id)
    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")
    for k, v in updates.items():
        setattr(char, k, v)
    db.commit()
    db.refresh(char)
    return char


@router.delete("/characters/{character_id}", status_code=204)
def delete_character(
    character_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    char = _get_character_or_404(db, character_id, user.id)
    db.delete(char)
    db.commit()
