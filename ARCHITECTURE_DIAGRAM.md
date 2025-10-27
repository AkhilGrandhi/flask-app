# 🏗️ Async Resume Generation Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                             │  │
│  │                                                               │  │
│  │  • CandidateDetail Component                                 │  │
│  │  • Progress Tracking                                         │  │
│  │  • Status Polling (every 2s)                                 │  │
│  │  • Auto-download                                             │  │
│  └───────────────────┬──────────────────────────────────────────┘  │
│                      │                                               │
│                      │ HTTP/REST API                                 │
└──────────────────────┼───────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RENDER CLOUD PLATFORM                           │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    Backend API (Flask)                      │    │
│  │                    Gunicorn: 4w × 2t                        │    │
│  │  ┌──────────────────────────────────────────────────────┐  │    │
│  │  │  Endpoints:                                           │  │    │
│  │  │  • POST /api/resume-async/generate-async             │  │    │
│  │  │  • GET  /api/resume-async/job-status/<id>            │  │    │
│  │  │  • GET  /api/resume-async/download/<id>              │  │    │
│  │  │  • GET  /api/resume-async/my-jobs                    │  │    │
│  │  └───────────────────┬──────────────────────────────────┘  │    │
│  └────────────────────┬─┴──────────────────────────────────────┘    │
│                       │                                              │
│                       │ Publishes tasks                              │
│                       ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Redis (Queue + Cache)                     │   │
│  │                                                              │   │
│  │  Queues:                        Cache:                      │   │
│  │  • resume_generation (default)  • Resume results (1h TTL)   │   │
│  │  • priority_high                • Job metadata             │   │
│  │                                                              │   │
│  └──────────────────┬───────────────────────────────────────────┘   │
│                     │                                                │
│                     │ Consumes tasks                                 │
│                     ▼                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Celery Worker (Background Jobs)                 │   │
│  │              Concurrency: 2 tasks                            │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │  Task: generate_resume_async()                         │ │   │
│  │  │                                                         │ │   │
│  │  │  1. Check Redis cache                                  │ │   │
│  │  │  2. If cached → Return immediately                     │ │   │
│  │  │  3. If not cached:                                     │ │   │
│  │  │     a. Call OpenAI API (2 parallel calls)              │ │   │
│  │  │     b. Generate DOCX/PDF                               │ │   │
│  │  │     c. Save to database                                │ │   │
│  │  │     d. Cache result in Redis                           │ │   │
│  │  │  4. Update job status in DB                            │ │   │
│  │  │  5. Return result                                      │ │   │
│  │  └────────────────┬───────────────────────────────────────┘ │   │
│  └───────────────────┼─────────────────────────────────────────┘   │
│                      │                                              │
│                      │ Stores/Retrieves                              │
│                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                             │   │
│  │                                                              │   │
│  │  Tables:                                                     │   │
│  │  • candidate                                                 │   │
│  │  • candidate_job                                             │   │
│  │  • resume_generation_job ← NEW                              │   │
│  │    - id (task_id)                                            │   │
│  │    - status (PENDING/PROCESSING/SUCCESS/FAILURE)             │   │
│  │    - progress (0-100)                                        │   │
│  │    - error_message                                           │   │
│  │    - timestamps                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Flower (Monitoring UI)                          │   │
│  │              https://flask-app-flower-dev.onrender.com       │   │
│  │                                                              │   │
│  │  • Real-time task monitoring                                 │   │
│  │  • Success/failure rates                                     │   │
│  │  • Worker status                                             │   │
│  │  • Queue length                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
                       │
                       │ API Calls
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         OpenAI API                                   │
│                                                                       │
│  • Model: gpt-4o-mini                                                │
│  • 2 parallel calls per resume:                                      │
│    1. Main sections (summary, skills, education, certs)              │
│    2. Work experience                                                │
│  • Rate limit: 10 tasks/minute (configured in Celery)               │
│  • Automatic retry with exponential backoff                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Diagram

### Scenario 1: New Resume Generation (No Cache)

```
User                 Frontend              Backend API         Celery Queue        Celery Worker        OpenAI          Redis Cache      Database
 │                      │                      │                    │                   │                 │                 │              │
 │  Click "Generate"   │                      │                    │                   │                 │                 │              │
 ├────────────────────►│                      │                    │                   │                 │                 │              │
 │                     │  POST /generate-async│                    │                   │                 │                 │              │
 │                     ├─────────────────────►│                    │                   │                 │                 │              │
 │                     │                      │  Publish task      │                   │                 │                 │              │
 │                     │                      ├───────────────────►│                   │                 │                 │              │
 │                     │                      │  Create job record │                   │                 │                 │              │
 │                     │                      ├───────────────────────────────────────────────────────────────────────────►│
 │                     │  {job_id: "abc..."}  │                    │                   │                 │                 │              │
 │                     │◄─────────────────────┤                    │                   │                 │                 │              │
 │  Job started!       │                      │                    │                   │                 │                 │              │
 │◄────────────────────┤                      │                    │                   │                 │                 │              │
 │  (returns in < 1s)  │                      │                    │                   │                 │                 │              │
 │                     │                      │                    │  Consume task     │                 │                 │              │
 │                     │                      │                    ├──────────────────►│                 │                 │              │
 │                     │                      │                    │                   │  Check cache    │                 │              │
 │                     │                      │                    │                   ├────────────────────────────────────►│
 │                     │                      │                    │                   │  Cache miss     │                 │              │
 │                     │                      │                    │                   │◄────────────────────────────────────┤
 │  Poll status        │                      │                    │                   │  Generate (main)│                 │              │
 │  (every 2s)         │                      │                    │                   ├────────────────►│                 │              │
 ├────────────────────►│  GET /job-status/abc │                    │                   │  Generate (exp) │                 │              │
 │                     ├─────────────────────►│                    │                   ├────────────────►│                 │              │
 │                     │                      │  Query DB          │                   │                 │                 │              │
 │                     │                      ├───────────────────────────────────────────────────────────────────────────►│
 │                     │  {status:PROCESSING, │                    │                   │  AI responses   │                 │              │
 │                     │   progress: 30}      │                    │                   │◄────────────────┤                 │              │
 │                     │◄─────────────────────┤                    │                   │                 │                 │              │
 │  30% complete       │                      │                    │                   │  Create DOCX    │                 │              │
 │◄────────────────────┤                      │                    │                   ├──┐              │                 │              │
 │                     │                      │                    │                   │  │              │                 │              │
 │  Poll again...      │                      │                    │                   │◄─┘              │                 │              │
 ├────────────────────►│  GET /job-status/abc │                    │                   │  Save to DB     │                 │              │
 │                     ├─────────────────────►│                    │                   ├────────────────────────────────────────────────────►│
 │                     │                      │                    │                   │  Cache result   │                 │              │
 │                     │                      │                    │                   ├────────────────────────────────────►│              │
 │                     │  {status: SUCCESS,   │                    │                   │  Update status  │                 │              │
 │                     │   progress: 100}     │                    │                   ├────────────────────────────────────────────────────►│
 │                     │◄─────────────────────┤                    │                   │                 │                 │              │
 │  100% - Download!   │                      │                    │                   │                 │                 │              │
 │◄────────────────────┤                      │                    │                   │                 │                 │              │
 │                     │  GET /download/abc   │                    │                   │                 │                 │              │
 │                     ├─────────────────────►│                    │                   │                 │                 │              │
 │                     │                      │  Get result        │                   │                 │                 │              │
 │                     │                      ├────────────────────┼───────────────────┼─────────────────┼─────────────────►│
 │                     │  resume.docx (blob)  │                    │                   │                 │                 │              │
 │                     │◄─────────────────────┤                    │                   │                 │                 │              │
 │  📄 Resume.docx     │                      │                    │                   │                 │                 │              │
 │◄────────────────────┤                      │                    │                   │                 │                 │              │
 │                     │                      │                    │                   │                 │                 │              │

Total time: ~30-60 seconds (background)
User wait: < 1 second
```

### Scenario 2: Cached Resume Generation

```
User                 Frontend              Backend API         Celery Queue        Celery Worker        Redis Cache      Database
 │                      │                      │                    │                   │                 │              │
 │  Click "Generate"   │                      │                    │                   │                 │              │
 ├────────────────────►│                      │                    │                   │                 │              │
 │                     │  POST /generate-async│                    │                   │                 │              │
 │                     ├─────────────────────►│                    │                   │                 │              │
 │                     │                      │  Publish task      │                   │                 │              │
 │                     │                      ├───────────────────►│                   │                 │              │
 │                     │  {job_id: "def..."}  │                    │                   │                 │              │
 │                     │◄─────────────────────┤                    │                   │                 │              │
 │  Job started!       │                      │                    │  Consume task     │                 │              │
 │◄────────────────────┤                      │                    ├──────────────────►│                 │              │
 │                     │                      │                    │                   │  Check cache    │              │
 │  Poll status        │                      │                    │                   ├────────────────►│              │
 ├────────────────────►│  GET /job-status/def │                    │                   │  Cache HIT! ✓   │              │
 │                     ├─────────────────────►│                    │                   │◄────────────────┤              │
 │                     │  {status: SUCCESS,   │                    │                   │  Save to DB     │              │
 │                     │   progress: 100}     │                    │                   ├────────────────────────────────►│
 │                     │◄─────────────────────┤                    │                   │                 │              │
 │  100% - Download!   │                      │                    │                   │                 │              │
 │◄────────────────────┤                      │                    │                   │                 │              │
 │                     │  GET /download/def   │                    │                   │                 │              │
 │                     ├─────────────────────►│                    │                   │                 │              │
 │                     │  resume.docx (blob)  │                    │                   │                 │              │
 │                     │◄─────────────────────┤                    │                   │                 │              │
 │  📄 Resume.docx     │                      │                    │                   │                 │              │
 │◄────────────────────┤                      │                    │                   │                 │              │

Total time: ~1-2 seconds (from cache!)
User wait: < 1 second
OpenAI API calls: 0 (saved $$$)
```

---

## Data Flow

### Database Schema: `resume_generation_job`

```sql
CREATE TABLE resume_generation_job (
    id VARCHAR(255) PRIMARY KEY,              -- Celery task ID
    candidate_id INTEGER NOT NULL,            -- FK to candidate
    job_row_id INTEGER,                       -- FK to candidate_job
    status VARCHAR(50) DEFAULT 'PENDING',     -- PENDING/PROCESSING/SUCCESS/FAILURE
    progress INTEGER DEFAULT 0,               -- 0-100
    file_type VARCHAR(20) DEFAULT 'word',     -- word or pdf
    result_url VARCHAR(512),                  -- Filename or URL
    error_message TEXT,                       -- Error details if failed
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    INDEX idx_candidate_id (candidate_id),
    INDEX idx_job_row_id (job_row_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

### Redis Cache Structure

```
Key: resume_cache:<md5_hash>
Value: Pickled object {
    'merged_text': '...',      # Full resume text
    'filename': '...',         # Generated filename
    'file_data': '...'         # Base64-encoded file
}
TTL: 3600 seconds (1 hour)
```

### Celery Queue Structure

```
Queue: resume_generation (default)
├── Task 1: generate_resume_async(task_id="abc", ...)
├── Task 2: generate_resume_async(task_id="def", ...)
└── Task 3: generate_resume_async(task_id="ghi", ...)

Queue: priority_high (for urgent jobs)
└── (Empty)
```

---

## Scaling Patterns

### Horizontal Scaling (Add More Workers)

```
┌─────────────┐
│   Backend   │ ─────┐
│  (4w × 2t)  │      │
└─────────────┘      │
                     ├──► ┌───────────┐
┌─────────────┐      │    │   Redis   │
│   Backend   │ ─────┤    │  (Queue)  │
│  (4w × 2t)  │      │    └─────┬─────┘
└─────────────┘      │          │
                     │          ▼
┌─────────────┐      │    ┌───────────┐ ┌───────────┐ ┌───────────┐
│   Backend   │ ─────┘    │  Worker 1 │ │  Worker 2 │ │  Worker 3 │
│  (4w × 2t)  │           │  (2 conc) │ │  (2 conc) │ │  (2 conc) │
└─────────────┘           └───────────┘ └───────────┘ └───────────┘

Total capacity: 3 backends × 8 = 24 concurrent API requests
                3 workers × 2 = 6 concurrent resume generations
```

### Vertical Scaling (Increase Resources)

```
Free Tier:          Starter:           Standard:
┌──────────┐       ┌──────────┐       ┌──────────┐
│ Backend  │       │ Backend  │       │ Backend  │
│ 512MB    │  ───► │  2GB     │  ───► │  4GB+    │
│ 4w × 2t  │       │ 8w × 2t  │       │ Auto     │
└──────────┘       └──────────┘       └──────────┘
┌──────────┐       ┌──────────┐       ┌──────────┐
│  Worker  │       │  Worker  │       │  Worker  │
│ 512MB    │  ───► │  2GB     │  ───► │  4GB+    │
│ 2 conc   │       │ 4 conc   │       │ 8+ conc  │
└──────────┘       └──────────┘       └──────────┘
┌──────────┐       ┌──────────┐       ┌──────────┐
│  Redis   │       │  Redis   │       │  Redis   │
│  25MB    │  ───► │  256MB   │  ───► │  1GB+    │
└──────────┘       └──────────┘       └──────────┘

Capacity:          Capacity:          Capacity:
~100 users         ~500 users         ~2000+ users
```

---

## Performance Optimization Strategies

### 1. **Caching Layer**

```
┌─────────────────────────────────────────┐
│            Cache Strategy                │
├─────────────────────────────────────────┤
│                                          │
│  L1: Redis (Hot data - 1 hour TTL)      │
│  └─► Resume results, job metadata       │
│                                          │
│  L2: Database (Persistent)               │
│  └─► Resume content, job history        │
│                                          │
│  Cache Hit Ratio Target: > 30%           │
│  Average savings: $0.02 per hit          │
└─────────────────────────────────────────┘
```

### 2. **Rate Limiting**

```
┌──────────────────────────────────────────┐
│         Rate Limiting Layers              │
├──────────────────────────────────────────┤
│                                           │
│  API Level:   100 requests/minute/user   │
│  Celery:      10 tasks/minute            │
│  OpenAI:      Automatic retry on 429     │
│                                           │
│  Prevents:                                │
│  • API abuse                              │
│  • OpenAI rate limit errors               │
│  • Resource exhaustion                    │
└──────────────────────────────────────────┘
```

### 3. **Parallel Processing**

```
Resume Generation Pipeline:
┌───────────────────────────────────┐
│  Sequential (Old):                 │
│  Main sections → 30s               │
│  Work experience → 30s             │
│  Total: 60 seconds                 │
└───────────────────────────────────┘
           ↓
┌───────────────────────────────────┐
│  Parallel (New):                   │
│  Main sections ──┐                 │
│                  ├─► Merge → 30s   │
│  Work experience ┘                 │
│  Total: 30 seconds (50% faster!)   │
└───────────────────────────────────┘
```

---

## Fault Tolerance

### Retry Strategy

```
Task Execution:
┌────────────────────────────────────────┐
│  Attempt 1: Execute immediately         │
│  ↓                                      │
│  Fail? → Wait 4s → Attempt 2           │
│  ↓                                      │
│  Fail? → Wait 8s → Attempt 3           │
│  ↓                                      │
│  Fail? → Mark as FAILURE               │
│         → Store error message           │
│         → Notify user                   │
└────────────────────────────────────────┘

Success Rate: ~98% (with 3 retries)
```

### Health Monitoring

```
┌─────────────────────────────────────────┐
│          Health Checks                   │
├─────────────────────────────────────────┤
│                                          │
│  Backend API:  /api/healthz              │
│  └─► Expected: {"status": "ok"}         │
│                                          │
│  Redis:        redis-cli PING            │
│  └─► Expected: PONG                      │
│                                          │
│  Celery:       inspect ping              │
│  └─► Expected: Worker list               │
│                                          │
│  Database:     SELECT 1                  │
│  └─► Expected: 1                         │
└─────────────────────────────────────────┘
```

---

## Cost Optimization

### Resource Utilization

```
┌──────────────────────────────────────────────────┐
│              Cost Breakdown (Monthly)             │
├──────────────────────────────────────────────────┤
│                                                   │
│  Render Services (Free Tier):          $0        │
│  • Backend API                                    │
│  • Celery Worker                                  │
│  • Redis (25MB)                                   │
│  • PostgreSQL (shared)                            │
│                                                   │
│  OpenAI API (Estimated):                $10-50    │
│  • gpt-4o-mini: $0.15/1M input tokens             │
│  • Average: 2,000 tokens per resume               │
│  • 100 resumes/day × 30 days = 3,000 resumes      │
│  • Cost: ~$0.90/day = ~$27/month                  │
│                                                   │
│  With Caching (30% hit rate):           $18-35    │
│  • Savings: $8-15/month                           │
│                                                   │
│  Total Cost (Free Tier + OpenAI):       $18-35    │
├──────────────────────────────────────────────────┤
│  Upgrade to Starter ($7/service):       $39-56    │
│  • 3 services × $7 = $21/month                    │
│  • OpenAI: $18-35/month                           │
│  • Better performance, higher capacity            │
└──────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────┐
│              Security Layers                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Authentication (JWT)                         │
│     └─► Required for all async endpoints        │
│                                                  │
│  2. Authorization                                │
│     └─► Users can only access their jobs        │
│                                                  │
│  3. Rate Limiting                                │
│     └─► Prevent abuse and DoS                   │
│                                                  │
│  4. Input Validation                             │
│     └─► Sanitize job descriptions                │
│                                                  │
│  5. Secure Storage                               │
│     └─► Environment variables for secrets       │
│                                                  │
│  6. HTTPS Only                                   │
│     └─► All traffic encrypted                   │
│                                                  │
│  7. Redis Access Control                         │
│     └─► IP whitelist (production)               │
└─────────────────────────────────────────────────┘
```

---

**Architecture Status:** ✅ Production Ready  
**Scalability:** ✅ Horizontal & Vertical  
**Reliability:** ✅ Fault Tolerant  
**Performance:** ✅ Optimized  
**Cost:** ✅ Efficient

