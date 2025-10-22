# app/ai.py
import os, json, re
from flask import Blueprint, request, jsonify
from openai import OpenAI
from .models import Candidate
from .utils import model_to_dict

bp = Blueprint("ai", __name__)

def _client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)

def _naive_map(form: dict, cand: dict) -> dict:
    """Fallback when no OPENAI_API_KEY: do a tiny heuristic mapping."""
    mapping = {}
    def pick(*names):
        for n in names:
            v = cand.get(n)
            if v not in (None, ""):
                return str(v)
        return ""

    for key, meta in form.items():
        t = (meta or {}).get("type", "text")
        if t == "file":
            continue
        k = key.lower()

        if "dob" in k or "birth" in k:
            v = pick("birthdate", "dob", "date_of_birth")
            if v:
                # try to normalize to DD/MM/YYYY
                from datetime import datetime
                for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
                    try:
                        d = datetime.strptime(v, fmt)
                        v = d.strftime("%d/%m/%Y")
                        break
                    except: pass
                mapping[key] = v
            continue

        if "first" in k and "name" in k:
            v = pick("first_name")
            if v: mapping[key] = v; continue

        if "last" in k and "name" in k:
            v = pick("last_name")
            if v: mapping[key] = v; continue

        if "email" in k:
            v = pick("email")
            if v: mapping[key] = v; continue

        if "country_code" in k:
            country = (pick("country","nationality") or "").lower()
            if "india" in country: mapping[key] = "+91"
            continue

        if "phone" in k or "contact" in k or "mobile" in k:
            v = pick("phone","mobile")
            if v:
                digits = re.sub(r"\D+","", v)
                mapping[key] = digits
            continue

        if "skill" in k:
            v = pick("technical_skills")
            if v: mapping[key] = v; continue

        if "total_experience" in k or ("experience" in k and "total" in k):
            we = pick("work_experience") or ""
            m = re.search(r"(\d+)\s*\+?\s*(?:years|yrs|y)", we, re.I)
            if m: mapping[key] = m.group(1) + "+"
            continue

    return mapping

@bp.post("/map-fields")
def map_fields():
    payload = request.get_json() or {}
    form = payload.get("form")         # dict of { field_key: {type,label,...} }
    # print(form)
    cand_id = payload.get("candidate_id")
    candidate = payload.get("candidate")

    if not isinstance(form, dict):
        return {"message": "form must be an object"}, 400

    # Load candidate if only id was provided
    if candidate is None and cand_id:
        cobj = Candidate.query.get_or_404(int(cand_id))
        candidate = model_to_dict(cobj, exclude=set())

    if not isinstance(candidate, dict):
        return {"message": "candidate or candidate_id is required"}, 400

    # Prefer GPT if key is present
    client = _client()
    if not client:
        return jsonify({"model": "naive", "mapping": _naive_map(form, candidate)}), 200

    # Build prompt (very explicit)
    rules = """
    You will receive:
    1) FORM_SCHEMA: an object whose keys are the form field identifiers (prefer `name`, else `id`).
    2) CANDIDATE: a candidate profile with fields such as first_name, last_name, email, phone, birthdate, nationality, country, technical_skills, work_experience, etc.

    Output:
    - A SINGLE JSON object mapping form keys to autofill values.
    - Keys MUST be EXACTLY the keys from FORM_SCHEMA (do not invent new keys).
    - Exclude any fields of type "file" (e.g., resume, coverLetter, input_file1, etc.).
    - If a field has type "text" for date (e.g., key like "dob", "date_of_birth", "birthdate"), format as DD/MM/YYYY.
    - If a field is of type "date" or "datetime-local", use YYYY-MM-DD.
    - If a field is of type "time", use HH:MM (24-hour format).
    - If a field is type "number", ensure it contains a numeric value.

    Mapping hints (apply these where relevant in FORM_SCHEMA):
    - `firstName` or similar → candidate.first_name
    - `lastName` or similar → candidate.last_name
    - `email` → candidate.email
    - `primary_contact_no` or `phone` → candidate.phone (digits only; strip spaces, dashes, parentheses)
    - `country_code`:
        * If candidate.country or nationality is India → "+91"
        * Else if phone has country prefix → infer and use (e.g., "+1" for US)
        * Else → empty string
    - `dob`, `date_of_birth`, `birthdate` → candidate.birthdate (formatted per rules above)
    - `total_experience`:
        * If candidate.work_experience has start and end years → calculate full years
        * Else if textual → extract best-match number or return e.g., "5+"
    - `previous_employer` → candidate.latest_employer or inferred from work_experience
    - `skill`, `skills`, or checkbox-groups → match candidate.technical_skills to options
    - `experience` (dropdown) → match best-fit to candidate.total_experience (e.g., "2-5", "6-10")
    - `country` (dropdown) → match candidate.country or nationality
    - `employmentType`, `remoteWork` (radio-groups):
        * Use case-insensitive label match with candidate.employment_type or preferences
    - `notifications` (checkbox-group) → match candidate.notification_preferences or similar
    - If a field is `isRequired: true` and no value can be matched, leave it blank (but include the key)

    Additional rules:
    - Boolean values in schema (e.g., hasLabel, isRequired) → return `true` or `false` only if a field in candidate profile directly maps to it (e.g., boolean preferences, availability flags)
    - Avoid default or placeholder values like "Select one" or empty dropdown values (e.g., "")
    - For checkbox-group, map to a list of matched option values from candidate data
    - For radio-group or dropdown, map to a single string from `options` that best matches candidate data by value or label (case-insensitive)
    - Only return the final JSON mapping — no explanations, comments, or extra data
    """.strip()

    user = {
        "FORM_SCHEMA": form,
        "CANDIDATE": candidate
    }

    msg = [
        {"role": "system", "content": "You translate candidate data into website form values and return JSON only."},
        {"role": "user", "content": rules + "\n\n" + json.dumps(user, ensure_ascii=False)}
    ]

    resp = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=msg,
        temperature=0.2,
        max_tokens=700
    )

    text = (resp.choices[0].message.content or "").strip()
    # Try to parse JSON robustly
    try:
        mapping = json.loads(text)
    except Exception:
        m = re.search(r"\{.*\}", text, re.S)
        mapping = json.loads(m.group(0)) if m else {}

    return jsonify({"model": "gpt-4.1-mini", "mapping": mapping}), 200
