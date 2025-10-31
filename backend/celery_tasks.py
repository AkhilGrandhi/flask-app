"""
Celery tasks for async resume generation
"""
import os
import re
import traceback
import hashlib
import json
from datetime import datetime
from io import BytesIO
from celery_config import celery_app
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import redis

# Redis client for caching
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
redis_client = redis.from_url(REDIS_URL, decode_responses=False)  # Binary mode for file data

# Import resume generation functions
from app.candidateresumebuilder import (
    create_resume_word,
    create_resume_pdf,
    clean_markdown,
    extract_total_experience
)
from concurrent.futures import ThreadPoolExecutor

# OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def update_job_progress(task_id, status, progress, error_message=None, result_url=None):
    """Update job progress in database"""
    from app import create_app
    from app.models import db, ResumeGenerationJob
    
    app = create_app()
    with app.app_context():
        job = ResumeGenerationJob.query.get(task_id)
        if job:
            job.status = status
            job.progress = progress
            if error_message:
                job.error_message = error_message
            if result_url:
                job.result_url = result_url
            if status == 'PROCESSING' and not job.started_at:
                job.started_at = datetime.utcnow()
            if status in ['SUCCESS', 'FAILURE']:
                job.completed_at = datetime.utcnow()
            db.session.commit()


@retry(
    retry=retry_if_exception_type(Exception),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def call_openai_with_retry(client, prompt, system_message):
    """Call OpenAI API with retry logic"""
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )
    return resp.choices[0].message.content or ""


def get_cache_key(job_desc, candidate_info, file_type):
    """Generate cache key from job description and candidate info"""
    content = f"{job_desc}:{candidate_info}:{file_type}"
    return f"resume_cache:{hashlib.md5(content.encode()).hexdigest()}"


@celery_app.task(bind=True, name='celery_tasks.generate_resume_async')
def generate_resume_async(
    self,
    task_id,
    job_desc,
    candidate_info,
    file_type,
    candidate_id,
    job_row_id
):
    """
    Async task to generate resume with caching
    
    Args:
        task_id: Celery task ID (also used as job ID in database)
        job_desc: Job description
        candidate_info: Candidate information
        file_type: 'word' or 'pdf'
        candidate_id: Candidate ID
        job_row_id: CandidateJob ID
    """
    try:
        # Check cache first
        cache_key = get_cache_key(job_desc, candidate_info, file_type)
        cached_result = redis_client.get(cache_key)
        
        if cached_result:
            # Cache hit! Return cached result immediately
            update_job_progress(task_id, 'PROCESSING', 50)
            
            # Decode cached data
            import pickle
            cached_data = pickle.loads(cached_result)
            
            # Save to database
            from app import create_app
            from app.models import db, CandidateJob
            
            app = create_app()
            with app.app_context():
                if candidate_id and job_row_id:
                    job_row = CandidateJob.query.filter_by(
                        id=job_row_id,
                        candidate_id=candidate_id
                    ).first()
                    if job_row:
                        job_row.resume_content = cached_data['merged_text']
                        db.session.commit()
            
            update_job_progress(task_id, 'SUCCESS', 100, result_url=cached_data['filename'])
            
            return {
                'status': 'SUCCESS',
                'filename': cached_data['filename'],
                'file_data': cached_data['file_data'],
                'file_type': file_type,
                'cached': True
            }
        
        # Update status to PROCESSING
        update_job_progress(task_id, 'PROCESSING', 10)
        
        # Initialize OpenAI client
        client = OpenAI(api_key=OPENAI_API_KEY)
        work_exp_str = extract_total_experience(candidate_info)
        
        # Update progress
        update_job_progress(task_id, 'PROCESSING', 20)
        
        # Define prompt functions
        def generate_main_sections():
            prompt = f"""
            You are a professional resume writer. Using the Job Description and Candidate Information provided below, generate a clean, ATS-optimized resume that strictly follows the section order and formatting rules listed here:

            ⚠️ IMPORTANT: Output must contain the **resume only** — do not include explanations, disclaimers, notes, or extra text outside of the resume.

            SECTION ORDER:

            1. **PROFESSIONAL SUMMARY** – Generate **6 to 8 bullet points**.  
                - The **first bullet point** must always mention the candidate's **total years of professional experience**. If this information is present in the JOB DESCRIPTION, use the role mentioned there when framing the experience.  
                    WORK EXPERIENCE: {work_exp_str}  
                - Represent the total experience as **"X+ years of experience"** (e.g., *5+ years*, *6+ years*).  
                - Each bullet point must be **at least 2 lines long**, providing rich, detailed information. Avoid short or generic bullets.  
                - The **remaining bullet points** (6–8 total) should comprehensively highlight the candidate's **key skills, achievements, career milestones, and qualifications** that align closely with the given Job Description.  
                - Each bullet must **start with "- "** (a hyphen followed by a space).  
  
            2. **SKILLS** – Based on the Job Description and Candidate Information:

                1. Identify the **most relevant role/position** (e.g., .NET Developer, Java Backend Engineer, Salesforce Developer, Data Engineer, DevOps Engineer).
                2. Create a **resume-ready Skills section** with **10–12 subsections**, tailored to that role and the JD.

                ⚠️ RULES:
                - Subsections must be **category-based** and recruiter-friendly (e.g., Programming Languages, Frameworks & Libraries, Databases, Cloud Platforms, DevOps & CI/CD, Testing & QA, Security & Compliance, Monitoring & Observability, Collaboration Tools).
                - Use concise, ATS-optimized, professional wording for subsection titles.
                - Fill each subsection with **8–20 related technologies/tools**, directly matching the JD and candidate info.
                - Where possible, **expand categories with specific services or tools** (e.g., list AWS services like EC2, S3, Glue, Lambda, CloudWatch — not just "AWS").
                - Always mirror exact JD keywords (e.g., if JD says "GCP, Spark, BigQuery, Kafka" → those must appear under correct categories).
                - Include versions where impactful (e.g., Java 11/17, .NET 6/7, Spring Boot 3.x, Hadoop 3.x).
                - Do not invent irrelevant categories or mix unrelated technologies into the wrong subsection.
                - Always include these **mandatory baseline categories**, even if not explicitly in the JD:
                    - Programming Languages  
                    - Operating Systems  
                    - Cloud Platforms
                    - DevOps & CI/CD Tools  
                    - Development Tools                   

                Example subsections (adjust dynamically per JD):  
                - Programming Languages  
                - Frameworks & Libraries  
                - Databases & Data Warehousing  
                - Big Data & Streaming  
                - Cloud Platforms  
                - DevOps & CI/CD Tools  
                - Testing & QA  
                - Security & Compliance  
                - Monitoring & Observability  
                - Collaboration Tools  
                - Documentation Tools  
                - Operating Systems  

                ⚠️ Ensure each subsection is **fully loaded with at least 8 skills** and contains **16–20 skills where possible**.
                ⚠️ All technologies listed here must also appear in the **Technologies Used** lines under the WORK EXPERIENCE section.



            3. **CERTIFICATIONS**

            4. **EDUCATION** 
                Format the education section clearly and consistently using the structure shown below. 

                Example Format:
                    MS in Computer Science
                    University of XYZ, USA | GPA: 3.8/4.0
                    B.Tech in Computer Science Engineering
                    JNTU Hyderabad | Percentage: 85%

                Make sure the formatting follows this structure exactly:
                [Degree] in [Field of Study]
                [University Name] | [GPA or Percentage]

                Do not include additional details like thesis titles, coursework, or graduation years unless specifically asked.
            
            ⚠️ IMPORTANT: Do NOT generate the WORK EXPERIENCE section. It will be added separately.

            FORMATTING RULES:
            - Display the candidate's **Name** at the top.
            - Center **Email**, **Phone Number**, and **Candidate Location** on the same line directly below the name, using the format:  
            Email: | Mobile: | Location:
            - Use 0.5-inch page margins.
            - Add a tab space before each bullet point.
            - Do not use markdown or bullet characters like "-", "*", or "•".
            - The **SKILLS** section must always follow the defined categories above—never as a plain list.
            - Always ensure the final resume spans at least 2 full pages of Word or PDF output.

            JOB DESCRIPTION:
            {job_desc}

            CANDIDATE INFORMATION:
            {candidate_info}
            """
            return call_openai_with_retry(
                client,
                prompt,
                "You write polished, ATS-friendly resumes."
            )

        def generate_work_experience():
            exp_prompt = f"""
            Generate ONLY the WORK EXPERIENCE section for this resume.

            3. **WORK EXPERIENCE** – Merge **Work History** and **Work Experience** into a unified section. For each job role:
                - ⚠️ IMPORTANT: Use WORK EXPERIENCE from the CANDIDATE INFORMATION only
                - Include the Job Title, Company Name (bold), Job Location, and timeline using the format:
                    [Company Name] – [Job Location]  
                    [Job Title] – [Start Month Year] to [End Month Year]

            - Add 10 to 15 high-impact bullet points per role. Each bullet point must:
            - Each bullet point must be exactly 2 lines long, with rich and specific details — including technologies used, metrics, project outcomes, team collaboration, challenges faced, and business impact.
            - "When generating points for each company, first identify the industry it operates in, and then tailor the points to be relevant to that specific industry projects.
            - Start with a strong action verb (e.g., Spearheaded, Engineered, Optimized, Automated, Delivered).
            - Focus on achievements, measurable outcomes, and business value rather than just responsibilities.
            - Include quantifiable results wherever possible (e.g., improved ETL performance by 35%, reduced deployment time by 40%, cut costs by 20% annually).
            - Highlight leadership, innovation, automation, and cross-functional collaboration.
            - Showcase modern practices (e.g., Cloud Migration, DevOps, CI/CD automation, Data Engineering, AI/ML, Security, Scalability).
            - Be specific, technical, and results-driven — not generic.
            

            - ⚠️ Validate technology usage against the job timeline:
            - ONLY include technologies, tools, frameworks, or platforms that were **publicly available and in practical use** during the given employment period.
            - Example: Do NOT include Generative AI, Azure OpenAI, MS Fabric, or other technologies launched post-2021 in roles dated 2020 or earlier.
            - Ensure all technologies and practices mentioned are **realistically applicable** based on release year and industry adoption timeline.

            - Total bullet points should follow this logic:
            - For 1 company: 15 to 20 bullet points.
            - For 2 companies: 15 to 20 bullet points each (total: 30-40 points).
            - For 3 companies: 10 to 15 bullet points each (total: 30-45 points).
            - For 4 companies: 10 to 15 bullet points each (total: 40-60 points).
            - For 5 companies: 10 to 15 bullet points each (total: 60-70 points).
            - For 6 companies: 10 to 15 bullet points each (total: 70-80 points).
            - For 7 companies: 10 to 15 bullet points each (total: 70-80 points).

            - No filler or repetition: Each bullet point must offer unique, concrete contributions or achievements.

            - Write in professional resume tone, use strong action verbs, and focus on clarity, impact, and relevance to technical or engineering roles.

            - End each job section with the line:  
            Technologies Used: tech1, tech2, ..., tech15  
                ⚠️ Ensure each role includes 10 to 15 technologies mapped directly from the SKILLS section.  
                ⚠️ Across all roles, the union of technologies must comprehensively cover the entire SKILLS section.

            JOB DESCRIPTION:
            {job_desc}

            CANDIDATE INFORMATION:
            {candidate_info}
            """
            return call_openai_with_retry(
                client,
                exp_prompt,
                "You write only the Work Experience section for ATS resumes."
            )
        
        # Update progress
        update_job_progress(task_id, 'PROCESSING', 30)
        
        # Generate both sections in parallel
        with ThreadPoolExecutor(max_workers=2) as executor:
            main_future = executor.submit(generate_main_sections)
            exp_future = executor.submit(generate_work_experience)
            raw_main = main_future.result()
            raw_exp = exp_future.result()
        
        # Update progress
        update_job_progress(task_id, 'PROCESSING', 70)
        
        # Merge content
        main_content = clean_markdown(raw_main).strip()
        work_exp_content = clean_markdown(raw_exp).strip()
        
        if work_exp_content and not work_exp_content.upper().startswith("WORK EXPERIENCE"):
            work_exp_content = "WORK EXPERIENCE\n" + work_exp_content
        
        merged_text = (main_content + "\n\n" + work_exp_content).strip()
        
        if not merged_text:
            raise Exception("Resume generation failed: Empty response")
        
        # Save resume content to database
        from app import create_app
        from app.models import db, CandidateJob
        
        app = create_app()
        with app.app_context():
            if candidate_id and job_row_id:
                job_row = CandidateJob.query.filter_by(
                    id=job_row_id,
                    candidate_id=candidate_id
                ).first()
                if job_row:
                    job_row.resume_content = merged_text
                    db.session.commit()
        
        # Update progress
        update_job_progress(task_id, 'PROCESSING', 85)
        
        # Generate file
        candidate_name = merged_text.splitlines()[0].strip()
        safe_name = re.sub(r'[^A-Za-z0-9]+', '_', candidate_name) or "Candidate"
        
        if file_type == "word":
            buffer = BytesIO()
            doc = create_resume_word(merged_text)
            doc.save(buffer)
            buffer.seek(0)
            file_data = buffer.getvalue()
            filename = f"{safe_name}_resume.docx"
        elif file_type == "pdf":
            buffer = create_resume_pdf(merged_text)
            file_data = buffer.getvalue()
            filename = f"{safe_name}_resume.pdf"
        else:
            raise Exception("Invalid file_type. Use 'word' or 'pdf'.")
        
        # Store file data in result (base64 encoded for JSON serialization)
        import base64
        file_base64 = base64.b64encode(file_data).decode('utf-8')
        
        # Cache the result for future use (TTL: 1 hour)
        import pickle
        cache_data = {
            'merged_text': merged_text,
            'filename': filename,
            'file_data': file_base64
        }
        try:
            redis_client.setex(
                cache_key,
                3600,  # 1 hour TTL
                pickle.dumps(cache_data)
            )
        except Exception as cache_error:
            print(f"Warning: Failed to cache result: {cache_error}")
        
        # Update job as SUCCESS
        update_job_progress(
            task_id,
            'SUCCESS',
            100,
            result_url=filename  # We'll store filename here
        )
        
        # Return result
        return {
            'status': 'SUCCESS',
            'filename': filename,
            'file_data': file_base64,
            'file_type': file_type,
            'cached': False
        }
        
    except Exception as e:
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        update_job_progress(task_id, 'FAILURE', 0, error_message=error_msg)
        
        # Raise exception to mark Celery task as failed
        raise

