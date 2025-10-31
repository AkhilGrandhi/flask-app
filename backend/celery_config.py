"""
Celery configuration for async task processing
"""
import os
from celery import Celery
from kombu import Queue

# Redis URL from environment
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

def make_celery(app_name=__name__):
    """Create and configure Celery instance"""
    celery = Celery(
        app_name,
        broker=REDIS_URL,
        backend=REDIS_URL,
        include=['celery_tasks']  # Include task modules
    )
    
    # Configuration
    celery.conf.update(
        # Task settings
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
        
        # Performance settings
        task_acks_late=True,  # Acknowledge task after completion
        worker_prefetch_multiplier=1,  # Don't prefetch tasks
        task_reject_on_worker_lost=True,
        
        # Result backend settings
        result_expires=3600,  # Results expire after 1 hour
        result_persistent=True,
        
        # Retry settings
        task_default_retry_delay=60,  # Retry after 60 seconds
        task_max_retries=3,
        
        # Queue settings
        task_default_queue='resume_generation',
        task_queues=(
            Queue('resume_generation', routing_key='resume.#'),
            Queue('priority_high', routing_key='priority.high'),
        ),
        
        # Rate limiting (prevent OpenAI rate limit issues)
        task_annotations={
            'celery_tasks.generate_resume_async': {
                'rate_limit': '10/m',  # 10 tasks per minute
            }
        }
    )
    
    return celery

celery_app = make_celery('resume_app')

