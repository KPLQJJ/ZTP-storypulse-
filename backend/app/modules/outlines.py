from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Novel
from app.models.outline import Outline
from app.models.user import User
from app.schemas import OutlineCreate, OutlineUpdate, OutlineOut, OutlineTreeNode
from app.modules.auth import get_current_user

router = APIRouter(tags=["outlines"])


def _get_outline_or_404(db: Session, outline_id: int, user_id: int) -> Outline:
    outline = db.get(Outline, outline_id)
    if not outline:
        raise HTTPException(status_code=404, detail="大纲条目不存在")
    novel = db.get(Novel, outline.novel_id)
    if not novel or novel.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权操作")
    return outline


def _verify_novel_owner(db: Session, novel_id: int, user_id: int) -> Novel:
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权操作此作品")
    return novel


def _build_tree(entries: list[Outline]) -> list[OutlineTreeNode]:
    """Build outline tree from flat list."""
    node_map: dict[int, OutlineTreeNode] = {}
    roots: list[OutlineTreeNode] = []

    for e in entries:
        node = OutlineTreeNode(
            id=e.id, novel_id=e.novel_id, parent_id=e.parent_id,
            title=e.title, content=e.content, sort_order=e.sort_order,
            created_at=e.created_at, updated_at=e.updated_at,
            children=[],
        )
        node_map[e.id] = node

    for node in node_map.values():
        if node.parent_id and node.parent_id in node_map:
            node_map[node.parent_id].children.append(node)
        else:
            roots.append(node)

    for parent in node_map.values():
        parent.children.sort(key=lambda c: (c.sort_order, c.id))

    roots.sort(key=lambda r: (r.sort_order, r.id))
    return roots


@router.get("/novels/{novel_id}/outlines", response_model=list[OutlineTreeNode])
def list_outlines(
    novel_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_novel_owner(db, novel_id, user.id)
    entries = (
        db.query(Outline)
        .filter(Outline.novel_id == novel_id)
        .order_by(Outline.sort_order, Outline.id)
        .all()
    )
    return _build_tree(entries)


@router.post("/novels/{novel_id}/outlines", response_model=OutlineOut, status_code=201)
def create_outline(
    novel_id: int,
    req: OutlineCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_novel_owner(db, novel_id, user.id)
    outline = Outline(
        novel_id=novel_id,
        parent_id=req.parent_id,
        title=req.title.strip(),
        content=req.content,
        sort_order=req.sort_order,
    )
    db.add(outline)
    db.commit()
    db.refresh(outline)
    return outline


@router.get("/outlines/{outline_id}", response_model=OutlineOut)
def get_outline(
    outline_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_outline_or_404(db, outline_id, user.id)


@router.patch("/outlines/{outline_id}", response_model=OutlineOut)
def update_outline(
    outline_id: int,
    req: OutlineUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    outline = _get_outline_or_404(db, outline_id, user.id)
    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")
    for k, v in updates.items():
        setattr(outline, k, v)
    db.commit()
    db.refresh(outline)
    return outline


@router.delete("/outlines/{outline_id}", status_code=204)
def delete_outline(
    outline_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    outline = _get_outline_or_404(db, outline_id, user.id)
    # Re-parent children to the deleted node's parent
    children = (
        db.query(Outline)
        .filter(Outline.parent_id == outline_id)
        .all()
    )
    for child in children:
        child.parent_id = outline.parent_id
    db.delete(outline)
    db.commit()
