# app/ai.py
import os, json, re
from flask import Blueprint, request, jsonify
from openai import OpenAI
from .models import Candidate
from .utils import model_to_dict

bp = Blueprint("ai", __name__)

def _client():
    # api_key = os.getenv("OPENAI_API_KEY")
    api_key = "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"
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
- Exclude file upload fields.
- If a field has type "text" for date (e.g., key like "dob", "birthdate"), format as DD/MM/YYYY.
- If a field is HTML date/datetime-local, use YYYY-MM-DD.
- Specific mapping hints (use if those keys exist in the FORM_SCHEMA):
  * primary_contact_no → digits-only phone (strip spaces and punctuation).
  * country_code → "+91" if nationality/country implies India; else infer from phone if it includes a country prefix; else empty string.
  * total_experience → compute from candidate.work_experience (full years). If uncertainty, return like "5+".
  * dob / date_of_birth / birthdate → from candidate.birthdate, formatted as specified above.
- When a select/radio exists, pick the best-matching option by VALUE or label text.
- Return ONLY the JSON mapping; no commentary.
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
