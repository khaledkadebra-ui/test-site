"""
Billing routes — ESG Copilot
POST /billing/checkout      — Create Stripe Checkout session
POST /billing/portal        — Create Stripe Customer Portal session
POST /billing/webhook       — Stripe webhook receiver
GET  /billing/status        — Current subscription status
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select

from app.core.config import settings
from app.core.deps import CurrentUser, DB
from app.services.email_service import send_subscription_confirmation

logger = logging.getLogger(__name__)
router = APIRouter()

PLAN_PRICES = {
    "starter":      settings.STRIPE_PRICE_STARTER,
    "professional": settings.STRIPE_PRICE_PRO,
}


# ── Schemas ────────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    plan: str  # "starter" | "professional"

class CheckoutResponse(BaseModel):
    checkout_url: str

class PortalResponse(BaseModel):
    portal_url: str

class SubscriptionStatus(BaseModel):
    plan: str
    status: str
    has_active_subscription: bool
    expires_at: str | None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_stripe():
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Payment processing is not configured. Please contact support."
        )
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/status", response_model=SubscriptionStatus)
async def get_subscription_status(current_user: CurrentUser):
    return SubscriptionStatus(
        plan=current_user.subscription_plan,
        status=current_user.subscription_status,
        has_active_subscription=current_user.has_active_subscription,
        expires_at=current_user.subscription_expires_at.isoformat() if current_user.subscription_expires_at else None,
    )


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(body: CheckoutRequest, current_user: CurrentUser, db: DB):
    if body.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan. Choose 'starter' or 'professional'.")

    price_id = PLAN_PRICES[body.plan]
    if not price_id:
        raise HTTPException(
            status_code=503,
            detail=f"Pricing for plan '{body.plan}' is not configured."
        )

    stripe = _get_stripe()

    # Create or retrieve Stripe customer
    if current_user.stripe_customer_id:
        customer_id = current_user.stripe_customer_id
    else:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.full_name or current_user.email,
            metadata={"user_id": str(current_user.id)},
        )
        customer_id = customer.id
        current_user.stripe_customer_id = customer_id
        await db.commit()

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.FRONTEND_URL}/pricing",
        metadata={"user_id": str(current_user.id), "plan": body.plan},
        allow_promotion_codes=True,
    )

    return CheckoutResponse(checkout_url=session.url)


@router.post("/portal", response_model=PortalResponse)
async def create_portal_session(current_user: CurrentUser):
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription found.")

    stripe = _get_stripe()
    session = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/billing",
    )
    return PortalResponse(portal_url=session.url)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, db: DB):
    """Handle Stripe webhook events."""
    if not settings.STRIPE_SECRET_KEY:
        return {"received": True}

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        user_id = data.get("metadata", {}).get("user_id")
        plan = data.get("metadata", {}).get("plan", "starter")
        if user_id:
            await _activate_subscription(db, user_id, plan, data.get("customer"))

    elif event_type in ("customer.subscription.updated", "customer.subscription.created"):
        await _update_subscription_from_stripe(db, data)

    elif event_type == "customer.subscription.deleted":
        await _cancel_subscription(db, data.get("customer"))

    elif event_type == "invoice.payment_failed":
        await _mark_past_due(db, data.get("customer"))

    return {"received": True}


async def _activate_subscription(db, user_id: str, plan: str, stripe_customer_id: str):
    from app.models.user import User
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.subscription_plan = plan
        user.subscription_status = "active"
        if stripe_customer_id:
            user.stripe_customer_id = stripe_customer_id
        await db.commit()
        send_subscription_confirmation(user.email, user.full_name or "", plan)
        logger.info("Activated %s subscription for user %s", plan, user_id)


async def _update_subscription_from_stripe(db, subscription_data: dict):
    from app.models.user import User
    customer_id = subscription_data.get("customer")
    if not customer_id:
        return
    result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    user = result.scalar_one_or_none()
    if not user:
        return

    stripe_status = subscription_data.get("status", "inactive")
    status_map = {
        "active": "active",
        "trialing": "trialing",
        "past_due": "past_due",
        "canceled": "cancelled",
        "unpaid": "past_due",
    }
    user.subscription_status = status_map.get(stripe_status, "inactive")

    # Determine plan from price ID
    items = subscription_data.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id", "")
        if price_id == settings.STRIPE_PRICE_PRO:
            user.subscription_plan = "professional"
        elif price_id == settings.STRIPE_PRICE_STARTER:
            user.subscription_plan = "starter"

    # Set expiry from current_period_end
    period_end = subscription_data.get("current_period_end")
    if period_end:
        user.subscription_expires_at = datetime.fromtimestamp(period_end, tz=timezone.utc)

    await db.commit()


async def _cancel_subscription(db, customer_id: str):
    from app.models.user import User
    if not customer_id:
        return
    result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    user = result.scalar_one_or_none()
    if user:
        user.subscription_status = "cancelled"
        user.subscription_plan = "free"
        await db.commit()


async def _mark_past_due(db, customer_id: str):
    from app.models.user import User
    if not customer_id:
        return
    result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    user = result.scalar_one_or_none()
    if user:
        user.subscription_status = "past_due"
        await db.commit()
