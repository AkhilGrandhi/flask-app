"""
Async resume generation endpoints
"""
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app.models import db, Candidate, CandidateJob, ResumeGenerationJob
from io import BytesIO
import base64

bp = Blueprint("resume_async", __name__)


def format_candidate_info(candidate):
    """Format candidate data for resume generation"""
    info = f"Name: {candidate.first_name} {candidate.last_name}\n"
    info += f"Email: {candidate.email or 'N/A'}\n"
    info += f"Phone: {candidate.phone or 'N/A'}\n"
    if candidate.city or candidate.state or candidate.country:
        info += f"Location: {', '.join(filter(None, [candidate.city, candidate.state, candidate.country]))}\n"
    info += "\n"
    
    if candidate.technical_skills:
        info += f"Technical Skills:\n{candidate.technical_skills}\n\n"
    
    if candidate.work_experience:
        info += f"Work Experience:\n{candidate.work_experience}\n\n"
    
    if candidate.education:
        info += f"Education:\n{candidate.education}\n\n"
    
    if candidate.certificates:
        info += f"Certifications:\n{candidate.certificates}\n\n"
    
    return info


@bp.post("/generate-async")
@jwt_required()
def generate_resume_async():
    """
    Initiate async resume generation
    
    Request body:
    {
        "candidate_id": 123,
        "job_row_id": 456,  # optional, if job already created
        "job_id": "JOB-001",  # optional
        "job_description": "...",
        "file_type": "word"  # or "pdf"
    }
    
    Response:
    {
        "job_id": "task-uuid-123",
        "status": "PENDING",
        "message": "Resume generation started"
    }
    """
    try:
        data = request.get_json()
        candidate_id = data.get("candidate_id")
        job_row_id = data.get("job_row_id")
        job_id_str = data.get("job_id", "")
        job_description = data.get("job_description", "")
        file_type = data.get("file_type", "word").lower()
        
        if not candidate_id or not job_description:
            return jsonify({"message": "Missing required fields"}), 400
        
        if file_type not in ['word', 'pdf']:
            return jsonify({"message": "Invalid file_type. Use 'word' or 'pdf'"}), 400
        
        try:
            candidate_id = int(candidate_id)
        except (TypeError, ValueError):
            return jsonify({"message": "Invalid candidate_id"}), 400

        # Get candidate
        candidate = Candidate.query.get_or_404(candidate_id)
        if (candidate.subscription_type or "").lower() == "silver":
            start_of_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            next_day = start_of_day + timedelta(days=1)
            generated_today = (
                CandidateJob.query
                .filter(
                    CandidateJob.candidate_id == candidate_id,
                    CandidateJob.resume_content.isnot(None),
                    CandidateJob.created_at >= start_of_day,
                    CandidateJob.created_at < next_day,
                )
                .count()
            )

            if generated_today >= 50:
                return jsonify({"message": "Your daily resume limit has been exceeded. Please try again tomorrow."}), 429

        if job_row_id is not None:
            try:
                job_row_id = int(job_row_id)
            except (TypeError, ValueError):
                return jsonify({"message": "Invalid job_row_id"}), 400
        
        # Create job row if not provided
        if not job_row_id:
            job_row = CandidateJob(
                candidate_id=candidate_id,
                job_id=job_id_str,
                job_description=job_description
            )
            db.session.add(job_row)
            db.session.commit()
            job_row_id = job_row.id
        
        # Format candidate info
        candidate_info = format_candidate_info(candidate)
        
        # Import celery task
        from celery_tasks import generate_resume_async as celery_task
        
        # Create task
        result = celery_task.apply_async(
            kwargs={
                'task_id': None,  # Will be set by bind=True
                'job_desc': job_description,
                'candidate_info': candidate_info,
                'file_type': file_type,
                'candidate_id': candidate_id,
                'job_row_id': job_row_id
            }
        )
        
        # Create job tracking record
        job_record = ResumeGenerationJob(
            id=result.id,
            candidate_id=candidate_id,
            job_row_id=job_row_id,
            file_type=file_type,
            status='PENDING',
            progress=0
        )
        db.session.add(job_record)
        db.session.commit()
        
        # Update task with actual task_id
        celery_task.apply_async(
            task_id=result.id,
            kwargs={
                'task_id': result.id,
                'job_desc': job_description,
                'candidate_info': candidate_info,
                'file_type': file_type,
                'candidate_id': candidate_id,
                'job_row_id': job_row_id
            }
        )
        
        return jsonify({
            "job_id": result.id,
            "status": "PENDING",
            "message": "Resume generation started",
            "job_row_id": job_row_id
        }), 202
        
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@bp.get("/job-status/<job_id>")
@jwt_required()
def get_job_status(job_id):
    """
    Get status of a resume generation job
    
    Response:
    {
        "id": "task-uuid-123",
        "status": "PROCESSING",
        "progress": 50,
        "result_url": null,
        "error_message": null,
        "created_at": "2025-01-01T00:00:00",
        "completed_at": null
    }
    """
    job = ResumeGenerationJob.query.get_or_404(job_id)
    return jsonify(job.to_dict()), 200


@bp.get("/download/<job_id>")
@jwt_required()
def download_resume(job_id):
    """
    Download generated resume
    
    Only works if job status is SUCCESS
    """
    job = ResumeGenerationJob.query.get_or_404(job_id)
    
    if job.status != 'SUCCESS':
        return jsonify({
            "message": f"Resume not ready. Current status: {job.status}"
        }), 400
    
    # Get result from Celery
    from celery_config import celery_app
    result = celery_app.AsyncResult(job_id)
    
    if not result.ready():
        return jsonify({"message": "Result not available"}), 404
    
    result_data = result.result
    
    if not result_data or 'file_data' not in result_data:
        return jsonify({"message": "File data not found"}), 404
    
    # Decode base64 file data
    file_data = base64.b64decode(result_data['file_data'])
    buffer = BytesIO(file_data)
    buffer.seek(0)
    
    # Determine mimetype
    if job.file_type == 'word':
        mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else:
        mimetype = 'application/pdf'
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name=result_data['filename'],
        mimetype=mimetype
    )


@bp.get("/my-jobs")
@jwt_required()
def get_my_jobs():
    """
    Get all resume generation jobs for current user's candidates
    """
    current_user_id = get_jwt_identity()
    
    # Get all candidates for current user
    candidates = Candidate.query.filter_by(created_by_user_id=current_user_id).all()
    candidate_ids = [c.id for c in candidates]
    
    # Get all jobs for these candidates
    jobs = ResumeGenerationJob.query.filter(
        ResumeGenerationJob.candidate_id.in_(candidate_ids)
    ).order_by(ResumeGenerationJob.created_at.desc()).limit(50).all()
    
    return jsonify({
        "jobs": [job.to_dict() for job in jobs]
    }), 200


@bp.delete("/job/<job_id>")
@jwt_required()
def cancel_job(job_id):
    """
    Cancel/delete a job
    """
    job = ResumeGenerationJob.query.get_or_404(job_id)
    
    # Revoke Celery task if still pending/processing
    if job.status in ['PENDING', 'PROCESSING']:
        from celery_config import celery_app
        celery_app.control.revoke(job_id, terminate=True)
        job.status = 'CANCELLED'
        job.error_message = 'Cancelled by user'
        db.session.commit()
    
    return jsonify({"message": "Job cancelled"}), 200

