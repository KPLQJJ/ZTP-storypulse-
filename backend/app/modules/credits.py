from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.billing import CreditTransaction
from app.models.user import User
from app.schemas import RechargeRequest, BalanceResponse, TransactionOut
from app.modules.auth import get_current_user

router = APIRouter(prefix="/credits", tags=["credits"])


def _get_latest_balance(db: Session, user_id: int, lock: bool = False) -> float:
    """获取用户最新余额（基于最后一条交易的 balance_after）。

    开启 lock=True 时使用 FOR UPDATE 防止并发写入导致余额不一致。
    """
    query = (
        db.query(CreditTransaction.balance_after)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id.desc())
    )
    if lock:
        query = query.with_for_update()

    row = query.first()
    return row[0] if row else 0.0


@router.get("/balance", response_model=BalanceResponse)
def get_balance(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    balance = _get_latest_balance(db, user.id)
    return BalanceResponse(user_id=user.id, balance=balance)


@router.post("/recharge", response_model=TransactionOut, status_code=201)
def recharge(
    req: RechargeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """用户充值积分。

    安全措施：
    - FOR UPDATE 锁防止并发充值导致余额错乱
    - 整个操作在一个事务中：锁余额 → 写交易 → 提交，保证原子性
    - balance_after = 当前余额 + 充值额，形成可审计链
    """
    if not req.is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"充值金额须在 0.01 ~ 10000.0 之间",
        )
    # 四舍五入到小数点后两位，防止浮点精度问题
    amount = round(req.amount, 2)

    # 加锁读取当前余额
    current = _get_latest_balance(db, user.id, lock=True)
    new_balance = round(current + amount, 2)

    txn = CreditTransaction(
        user_id=user.id,
        amount=amount,
        balance_after=new_balance,
        type="recharge",
        description=req.description,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return txn


@router.get("/transactions")
def list_transactions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """查询当前用户的积分流水（按时间倒序）。

    流水只追加不修改，保证可审计。
    """
    rows = (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user.id)
        .order_by(CreditTransaction.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return rows


@router.get("/transactions/{txn_id}", response_model=TransactionOut)
def get_transaction(
    txn_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """查看单笔交易详情（仅限自己的交易）"""
    txn = db.get(CreditTransaction, txn_id)
    if not txn or txn.user_id != user.id:
        raise HTTPException(status_code=404, detail="交易记录不存在")
    return txn


# ── 管理端 ──────────────────────────────────────────────


def _require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可操作")


@router.get("/admin/users/{user_id}/balance", response_model=BalanceResponse)
def admin_get_balance(
    user_id: int,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")
    balance = _get_latest_balance(db, user_id)
    return BalanceResponse(user_id=user_id, balance=balance)


@router.post("/admin/users/{user_id}/recharge", response_model=TransactionOut, status_code=201)
def admin_recharge(
    user_id: int,
    req: RechargeRequest,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """管理员为任意用户充值（如活动赠送、补偿等）"""
    _require_admin(admin)

    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")

    if not req.is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"充值金额须在 0.01 ~ 10000.0 之间",
        )
    amount = round(req.amount, 2)

    # 加锁读余额
    current = _get_latest_balance(db, user_id, lock=True)
    new_balance = round(current + amount, 2)

    desc = f"{req.description}（操作人：{admin.username}）"

    txn = CreditTransaction(
        user_id=user_id,
        amount=amount,
        balance_after=new_balance,
        type="bonus" if amount > 0 and req.amount <= 500 else "recharge",
        description=desc,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return txn
