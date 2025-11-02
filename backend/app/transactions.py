from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime, timedelta
from .models import db, Transaction, Candidate
import traceback
import uuid

bp = Blueprint("transactions", __name__)

def require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        from flask import abort
        abort(403, description="Admin only")


# ---- List all transactions for a candidate ----
@bp.get("/candidates/<int:candidate_id>/transactions")
@jwt_required()
def list_candidate_transactions(candidate_id):
    require_admin()
    try:
        # Check if transaction table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'transaction' not in inspector.get_table_names():
            return {"message": "Transaction table does not exist. Please run migrations."}, 500
        
        # Verify candidate exists
        candidate = Candidate.query.get(candidate_id)
        if not candidate:
            return {"message": "Candidate not found"}, 404
        
        # Get all transactions for this candidate
        transactions = Transaction.query.filter_by(candidate_id=candidate_id).order_by(Transaction.start_date.desc()).all()
        
        transactions_data = [t.to_dict() for t in transactions]
        
        return {
            "candidate": {
                "id": candidate.id,
                "first_name": candidate.first_name,
                "last_name": candidate.last_name,
                "email": candidate.email,
            },
            "transactions": transactions_data
        }
    except Exception as e:
        import logging
        logging.error(f"Error listing transactions: {e}")
        logging.error(traceback.format_exc())
        return {"message": f"Failed to list transactions: {str(e)}"}, 500


# ---- Get a single transaction ----
@bp.get("/transactions/<int:transaction_id>")
@jwt_required()
def get_transaction(transaction_id):
    require_admin()
    try:
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return {"message": "Transaction not found"}, 404
        
        return {"transaction": transaction.to_dict(include_candidate=True)}
    except Exception as e:
        import logging
        logging.error(f"Error getting transaction: {e}")
        logging.error(traceback.format_exc())
        return {"message": f"Failed to get transaction: {str(e)}"}, 500


# ---- Create a new transaction ----
@bp.post("/candidates/<int:candidate_id>/transactions")
@jwt_required()
def create_transaction(candidate_id):
    require_admin()
    try:
        # Check if transaction table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'transaction' not in inspector.get_table_names():
            return {"message": "Transaction table does not exist. Please run migrations."}, 500
        
        # Verify candidate exists
        candidate = Candidate.query.get(candidate_id)
        if not candidate:
            return {"message": "Candidate not found"}, 404
        
        data = request.get_json() or {}
        
        # Get dates from request or use candidate's subscription_start_date
        start_date_str = data.get("start_date")
        if not start_date_str and candidate.subscription_start_date:
            start_date = candidate.subscription_start_date
            if isinstance(start_date, datetime):
                start_date = start_date.date()
        elif start_date_str:
            start_date = datetime.fromisoformat(start_date_str).date()
        else:
            start_date = datetime.utcnow().date()
        
        # Always calculate end_date (start_date + 30 days) - auto-calculated, don't accept from request
        end_date = start_date + timedelta(days=30)
        
        # Generate unique transaction_id if not provided
        transaction_id = data.get("transaction_id")
        if not transaction_id:
            # Generate unique transaction ID: TXN-{timestamp}-{uuid}
            timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
            unique_id = str(uuid.uuid4())[:8].upper()
            transaction_id = f"TXN-{timestamp}-{unique_id}"
        
        # Check if transaction_id already exists
        existing = Transaction.query.filter_by(transaction_id=transaction_id).first()
        if existing:
            # Regenerate if duplicate
            timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
            unique_id = str(uuid.uuid4())[:8].upper()
            transaction_id = f"TXN-{timestamp}-{unique_id}"
        
        # Create transaction
        transaction = Transaction(
            candidate_id=candidate_id,
            transaction_id=transaction_id,
            original_transaction=data.get("original_transaction"),
            start_date=start_date,
            end_date=end_date
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return {"message": "Transaction created successfully", "transaction": transaction.to_dict()}, 201
    except Exception as e:
        import logging
        logging.error(f"Error creating transaction: {e}")
        logging.error(traceback.format_exc())
        db.session.rollback()
        return {"message": f"Failed to create transaction: {str(e)}"}, 500


# ---- Update a transaction ----
@bp.put("/transactions/<int:transaction_id>")
@jwt_required()
def update_transaction(transaction_id):
    require_admin()
    try:
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return {"message": "Transaction not found"}, 404
        
        data = request.get_json() or {}
        
        # Update fields
        start_date_updated = False
        if "start_date" in data:
            transaction.start_date = datetime.fromisoformat(data["start_date"]).date()
            start_date_updated = True
        
        # Automatically recalculate end_date when start_date is updated
        if start_date_updated:
            transaction.end_date = transaction.start_date + timedelta(days=30)
        
        if "original_transaction" in data:
            transaction.original_transaction = data["original_transaction"]
        
        # Note: end_date cannot be manually set - it's always calculated as start_date + 30 days
        
        # Note: transaction_id is unique and shouldn't be changed, but allow if explicitly provided
        if "transaction_id" in data and data["transaction_id"] != transaction.transaction_id:
            new_transaction_id = data["transaction_id"]
            # Check if new transaction_id already exists
            existing = Transaction.query.filter_by(transaction_id=new_transaction_id).first()
            if existing and existing.id != transaction_id:
                return {"message": "Transaction ID already exists"}, 400
            transaction.transaction_id = new_transaction_id
        
        db.session.commit()
        
        return {"message": "Transaction updated", "transaction": transaction.to_dict()}
    except Exception as e:
        import logging
        logging.error(f"Error updating transaction: {e}")
        logging.error(traceback.format_exc())
        db.session.rollback()
        return {"message": f"Failed to update transaction: {str(e)}"}, 500


# ---- Delete a transaction ----
@bp.delete("/transactions/<int:transaction_id>")
@jwt_required()
def delete_transaction(transaction_id):
    require_admin()
    try:
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return {"message": "Transaction not found"}, 404
        
        db.session.delete(transaction)
        db.session.commit()
        
        return {"message": "Transaction deleted"}
    except Exception as e:
        import logging
        logging.error(f"Error deleting transaction: {e}")
        logging.error(traceback.format_exc())
        db.session.rollback()
        return {"message": f"Failed to delete transaction: {str(e)}"}, 500

