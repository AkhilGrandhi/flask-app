from flask import Blueprint, request, abort, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime, timedelta, date
from .models import db, Subscription, Candidate, Transaction
import traceback

bp = Blueprint("subscriptions", __name__)

def require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        abort(403, description="Admin only")


# ---- List all subscriptions ----
@bp.get("/subscriptions")
@jwt_required()
def list_subscriptions():
    require_admin()
    try:
        # Check if table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'subscription' not in inspector.get_table_names():
            return {"message": "Subscription table does not exist. Please run migrations.", "subscriptions": []}, 404
        
        # Get query parameters
        status_filter = request.args.get("status")  # filter by status
        tier_filter = request.args.get("tier")  # filter by tier
        search = request.args.get("search", "").strip()  # search by candidate name/email
        
        # Start building query
        query = Subscription.query
        
        # Apply filters
        if status_filter:
            query = query.filter(Subscription.status == status_filter)
        if tier_filter:
            query = query.filter(Subscription.tier == tier_filter)
        
        # Apply search filter (look in related candidate data)
        if search:
            query = query.join(Candidate).filter(
                (Candidate.first_name.ilike(f"%{search}%")) |
                (Candidate.last_name.ilike(f"%{search}%")) |
                (Candidate.email.ilike(f"%{search}%"))
            )
        
        # Order by newest first
        subscriptions = query.order_by(Subscription.created_at.desc()).all()
        
        # Convert to dicts with candidate info and check expiration
        now = datetime.utcnow()
        subscriptions_data = []
        for sub in subscriptions:
            sub_dict = sub.to_dict()
            # Include candidate info
            candidate = Candidate.query.get(sub.candidate_id)
            if candidate:
                sub_dict["candidate"] = {
                    "id": candidate.id,
                    "first_name": candidate.first_name,
                    "last_name": candidate.last_name,
                    "email": candidate.email,
                    "phone": candidate.phone,
                    "subscription_type": candidate.subscription_type,
                    "subscription_start_date": candidate.subscription_start_date.isoformat() if candidate.subscription_start_date else None,
                }
            
            # Get last renewal date from latest transaction
            latest_transaction = Transaction.query.filter_by(candidate_id=sub.candidate_id).order_by(Transaction.start_date.desc()).first()
            if latest_transaction:
                sub_dict["last_renewal_date"] = latest_transaction.start_date.isoformat()
                # Update expires_at to use latest transaction's end_date
                sub_dict["expires_at"] = latest_transaction.end_date.isoformat() if latest_transaction.end_date else sub_dict["expires_at"]
            else:
                sub_dict["last_renewal_date"] = None
            
            # Check if subscription is expired using the latest transaction's end_date
            expires_at_date = latest_transaction.end_date if latest_transaction else sub.expires_at
            if expires_at_date:
                # Convert date to datetime for comparison if needed
                if isinstance(expires_at_date, date) and not isinstance(expires_at_date, datetime):
                    # It's a date object, convert to datetime at end of day
                    expires_at_dt = datetime.combine(expires_at_date, datetime.max.time())
                else:
                    # It's already a datetime
                    expires_at_dt = expires_at_date
                
                if expires_at_dt < now and sub.status == "active":
                    sub.status = "expired"
                    db.session.commit()
            
            subscriptions_data.append(sub_dict)
        
        return {"subscriptions": subscriptions_data}
    except Exception as e:
        import logging
        logging.error(f"Error listing subscriptions: {e}")
        return {"message": f"Failed to list subscriptions: {str(e)}"}, 500


# ---- Get subscription for a specific candidate ----
@bp.get("/subscriptions/<int:candidate_id>")
@jwt_required()
def get_subscription(candidate_id):
    require_admin()
    try:
        subscription = Subscription.query.filter_by(candidate_id=candidate_id).first()
        if not subscription:
            return {"message": "Subscription not found"}, 404
        
        sub_dict = subscription.to_dict()
        # Include candidate info
        candidate = Candidate.query.get(candidate_id)
        if candidate:
            sub_dict["candidate"] = {
                "id": candidate.id,
                "first_name": candidate.first_name,
                "last_name": candidate.last_name,
                "email": candidate.email,
                "phone": candidate.phone,
                "subscription_type": candidate.subscription_type,
                "subscription_start_date": candidate.subscription_start_date.isoformat() if candidate.subscription_start_date else None,
                }
        
        # Get last renewal date from latest transaction
        latest_transaction = Transaction.query.filter_by(candidate_id=candidate_id).order_by(Transaction.start_date.desc()).first()
        if latest_transaction:
            sub_dict["last_renewal_date"] = latest_transaction.start_date.isoformat()
            # Update expires_at to use latest transaction's end_date
            sub_dict["expires_at"] = latest_transaction.end_date.isoformat() if latest_transaction.end_date else sub_dict["expires_at"]
        else:
            sub_dict["last_renewal_date"] = None
        
        # Check if subscription is expired using the latest transaction's end_date
        now = datetime.utcnow()
        expires_at_date = latest_transaction.end_date if latest_transaction else subscription.expires_at
        if expires_at_date:
            # Convert date to datetime for comparison if needed
            if isinstance(expires_at_date, date) and not isinstance(expires_at_date, datetime):
                # It's a date object, convert to datetime at end of day
                expires_at_dt = datetime.combine(expires_at_date, datetime.max.time())
            else:
                # It's already a datetime
                expires_at_dt = expires_at_date
            
            if expires_at_dt < now and subscription.status == "active":
                subscription.status = "expired"
                db.session.commit()
        
        return {"subscription": sub_dict}
    except Exception as e:
        import logging
        logging.error(f"Error getting subscription: {e}")
        return {"message": f"Failed to get subscription: {str(e)}"}, 500


# ---- Create/Activate subscription ----
@bp.post("/subscriptions")
@jwt_required()
def create_subscription():
    require_admin()
    try:
        # Check if table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'subscription' not in inspector.get_table_names():
            return {"message": "Subscription table does not exist. Please run migrations."}, 500
        
        data = request.get_json() or {}
        candidate_id = data.get("candidate_id")
        tier = data.get("tier")  # 'Gold' or 'Silver'
        billing_cycle = data.get("billing_cycle", "monthly")  # 'monthly' or 'yearly'
        price = data.get("price")
        notes = data.get("notes")
        payment_method = data.get("payment_method", "manual")
        transaction_id = data.get("transaction_id")
        custom_expires_at = data.get("expires_at")  # Optional: custom expiry date from frontend
        
        if not candidate_id or not tier:
            return {"message": "candidate_id and tier are required"}, 400
        
        if tier not in ["Gold", "Silver"]:
            return {"message": "tier must be 'Gold' or 'Silver'"}, 400
        
        if billing_cycle not in ["monthly", "yearly"]:
            return {"message": "billing_cycle must be 'monthly' or 'yearly'"}, 400
        
        # Check if candidate exists
        candidate = Candidate.query.get(candidate_id)
        if not candidate:
            return {"message": "Candidate not found"}, 404
        
        # Check if subscription already exists for this candidate
        existing_sub = Subscription.query.filter_by(candidate_id=candidate_id).first()
        if existing_sub:
            return {"message": "Subscription already exists for this candidate"}, 409
        
        # Calculate expires_at - use custom date from frontend if provided, otherwise calculate
        if custom_expires_at:
            expires_at = datetime.fromisoformat(custom_expires_at)
        else:
            # Calculate based on candidate's subscription_start_date or current date
            if candidate.subscription_start_date:
                start_date = candidate.subscription_start_date
                # If the start date has time component, only use date part
                if isinstance(start_date, datetime):
                    start_date = start_date.date()
            else:
                start_date = datetime.utcnow().date()
            
            # Calculate expiry based on billing cycle from start date
            if billing_cycle == "monthly":
                expires_at = datetime.combine(start_date, datetime.min.time()) + timedelta(days=30)
            else:  # yearly
                expires_at = datetime.combine(start_date, datetime.min.time()) + timedelta(days=365)
        
        # Use current time for activated_at
        now = datetime.utcnow()
        
        # Calculate renewal_date as 1 day after expires_at
        renewal_date = expires_at + timedelta(days=1)
        
        # Create subscription
        subscription = Subscription(
            candidate_id=candidate_id,
            tier=tier,
            status="active",
            billing_cycle=billing_cycle,
            price=price,
            activated_at=now,
            expires_at=expires_at,
            renewal_date=renewal_date,
            notes=notes,
            payment_method=payment_method,
            transaction_id=transaction_id
        )
        
        db.session.add(subscription)
        
        # Update candidate subscription_type
        candidate.subscription_type = tier
        
        db.session.commit()
        
        return {"message": "Subscription created successfully", "subscription": subscription.to_dict()}, 201
    except Exception as e:
        import logging
        logging.error(f"Error creating subscription: {e}")
        logging.error(traceback.format_exc())
        db.session.rollback()
        return {"message": f"Failed to create subscription: {str(e)}"}, 500


# ---- Activate subscription ----
@bp.put("/subscriptions/<int:candidate_id>/activate")
@jwt_required()
def activate_subscription(candidate_id):
    require_admin()
    try:
        subscription = Subscription.query.filter_by(candidate_id=candidate_id).first()
        if not subscription:
            return {"message": "Subscription not found"}, 404
        
        data = request.get_json() or {}
        new_expiry = data.get("expires_at")  # Optional: set custom expiry
        
        # Get candidate to check subscription_start_date
        candidate = Candidate.query.get(candidate_id)
        
        # Calculate new expiry if not provided
        if not new_expiry:
            # Use candidate's subscription_start_date if available, otherwise use today
            if candidate and candidate.subscription_start_date:
                start_date = candidate.subscription_start_date
                # If the start date has time component, only use date part
                if isinstance(start_date, datetime):
                    start_date = start_date.date()
            else:
                start_date = datetime.utcnow().date()
            
            # Calculate expiry based on billing cycle from start date
            if subscription.billing_cycle == "monthly":
                expires_at = datetime.combine(start_date, datetime.min.time()) + timedelta(days=30)
            else:  # yearly
                expires_at = datetime.combine(start_date, datetime.min.time()) + timedelta(days=365)
            new_expiry = expires_at
        else:
            new_expiry = datetime.fromisoformat(new_expiry)
        
        subscription.expires_at = new_expiry
        subscription.status = "active"
        subscription.activated_at = datetime.utcnow()
        subscription.paused_at = None  # Clear paused_at when reactivating
        subscription.deactivated_at = None  # Clear deactivated_at when reactivating
        
        # Calculate renewal_date as 1 day after expires_at
        subscription.renewal_date = new_expiry + timedelta(days=1)
        
        # Update candidate subscription_type
        if candidate:
            candidate.subscription_type = subscription.tier
        
        db.session.commit()
        
        return {"message": "Subscription activated", "subscription": subscription.to_dict()}
    except Exception as e:
        import logging
        logging.error(f"Error activating subscription: {e}")
        logging.error(traceback.format_exc())
        db.session.rollback()
        return {"message": f"Failed to activate subscription: {str(e)}"}, 500


# ---- Deactivate subscription ----
@bp.delete("/subscriptions/<int:candidate_id>")
@jwt_required()
def deactivate_subscription(candidate_id):
    require_admin()
    try:
        subscription = Subscription.query.filter_by(candidate_id=candidate_id).first()
        if not subscription:
            return {"message": "Subscription not found"}, 404
        
        subscription.status = "deactivated"
        subscription.deactivated_at = datetime.utcnow()
        
        db.session.commit()
        
        return {"message": "Subscription deactivated"}
    except Exception as e:
        import logging
        logging.error(f"Error deactivating subscription: {e}")
        db.session.rollback()
        return {"message": f"Failed to deactivate subscription: {str(e)}"}, 500


# ---- Update subscription details ----
@bp.put("/subscriptions/<int:candidate_id>")
@jwt_required()
def update_subscription(candidate_id):
    require_admin()
    try:
        subscription = Subscription.query.filter_by(candidate_id=candidate_id).first()
        if not subscription:
            return {"message": "Subscription not found"}, 404
        
        data = request.get_json() or {}
        
        # Update allowed fields
        if "tier" in data:
            tier = data["tier"]
            if tier not in ["Gold", "Silver"]:
                return {"message": "tier must be 'Gold' or 'Silver'"}, 400
            subscription.tier = tier
            # Update candidate subscription_type
            candidate = Candidate.query.get(candidate_id)
            if candidate:
                candidate.subscription_type = tier
        
        if "billing_cycle" in data:
            billing_cycle = data["billing_cycle"]
            if billing_cycle not in ["monthly", "yearly"]:
                return {"message": "billing_cycle must be 'monthly' or 'yearly'"}, 400
            subscription.billing_cycle = billing_cycle
        
        if "price" in data:
            subscription.price = data["price"]
        
        if "notes" in data:
            subscription.notes = data["notes"]
        
        if "payment_method" in data:
            subscription.payment_method = data["payment_method"]
        
        if "transaction_id" in data:
            subscription.transaction_id = data["transaction_id"]
        
        if "expires_at" in data:
            subscription.expires_at = datetime.fromisoformat(data["expires_at"])
        
        if "renewal_date" in data:
            subscription.renewal_date = datetime.fromisoformat(data["renewal_date"])
        
        db.session.commit()
        
        return {"message": "Subscription updated", "subscription": subscription.to_dict()}
    except Exception as e:
        import logging
        logging.error(f"Error updating subscription: {e}")
        db.session.rollback()
        return {"message": f"Failed to update subscription: {str(e)}"}, 500

