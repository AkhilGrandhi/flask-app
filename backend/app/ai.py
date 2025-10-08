from flask import Blueprint, request
from flask_jwt_extended import jwt_required, verify_jwt_in_request, get_jwt, get_jwt_identity
from .models import db, Candidate

bp = Blueprint("ai", __name__)

def norm(s):
    return (s or "").strip().lower()

# simple synonym sets
SYN = {
    "first_name": {"first name", "firstname", "given name", "forename", "first"},
    "last_name":  {"last name", "lastname", "surname", "family name", "last"},
    "full_name":  {"full name", "name"},
    "email":      {"email", "e-mail", "email address"},
    "phone":      {"phone", "phone number", "mobile", "mobile number", "telephone"},
    "birthdate":  {"birthdate", "dob", "date of birth"},
    "gender":     {"gender", "sex"},
    "nationality":{"nationality"},
    "citizenship_status": {"citizenship", "citizenship status"},
    "visa_status": {"visa", "visa status"},
    "work_authorization": {"work authorization", "work permit", "authorization"},
    "willing_relocate": {"relocate", "willing to relocate", "ready to relocate"},
    "willing_travel": {"travel", "willing to travel"},
    "disability_status":{"disability"},
    "veteran_status":{"veteran"},
    "military_experience":{"military experience", "military"},
    "race_ethnicity":{"race", "ethnicity", "race/ethnicity"},

    "address_line1":{"address line 1", "address1", "street address", "address"},
    "address_line2":{"address line 2", "address2", "suite", "apt", "apartment"},
    "city":{"city", "town"},
    "state":{"state", "province", "region"},
    "postal_code":{"postal", "zip", "zip code", "postal code"},
    "country":{"country"},

    "personal_website":{"website", "personal website", "portfolio", "site"},
    "linkedin":{"linkedin"},
    "github":{"github"},

    "technical_skills":{"skills", "technical skills", "tech skills"},
    "work_experience":{"experience", "work experience", "bio", "summary", "about me"},
}

def best_label(field):
    parts = [field.get("label"), field.get("placeholder"), field.get("name"), field.get("id")]
    return norm(next((p for p in parts if p), ""))

def match_key(field):
    label = best_label(field)
    t = norm(field.get("type"))
    # quick typed hints
    if t in {"email"}: return "email"
    if t in {"tel", "phone"}: return "phone"
    if t in {"date"}: return "birthdate"

    # look for keyword hits
    for key, keys in SYN.items():
        for k in keys:
            if k in label:
                return key

    # fallback: basic name split guesses
    if "name" in label:
        if any(x in label for x in ["first", "given"]): return "first_name"
        if any(x in label for x in ["last", "family", "surname"]): return "last_name"
        return "full_name"
    return None

def value_for(key, cdict):
    if key == "full_name":
        fn = cdict.get("first_name") or ""
        ln = cdict.get("last_name") or ""
        return f"{fn} {ln}".strip()
    return cdict.get(key)

def coerce_for_input(field, val):
    t = norm(field.get("type"))
    if val is None: return None

    # booleans for select/checkbox/radio
    if t in {"checkbox", "radio"}:
        return bool(val) in (True, "true", "True")
    # date string stays YYYY-MM-DD
    # select: try to match option text/value
    return str(val)


# @jwt_required()   # the extension will send Bearer token
@bp.post("/map-fields")
def map_fields():
    payload = request.get_json() or {}
    candidate = payload.get("candidate")
    fields = payload.get("fields") or []
    # Allow candidate id OR whole candidate object
    if isinstance(candidate, dict):
        c = candidate
    else:
        cid = int(candidate)
        obj = Candidate.query.get_or_404(cid)
        c = obj.to_dict()

    out = {}
    for f in fields:
        key = match_key(f)
        if not key: 
            continue
        v = value_for(key, c)
        if v is None:
            continue

        # For special booleans, try to map "true/false" to appropriate choice later (content script)
        out_key = f.get("name") or f.get("id") or best_label(f) or str(len(out))
        out[out_key] = coerce_for_input(f, v)

    # 🔌 (Optional) GPT pass to improve mapping (disabled by default)
    # You can call your LLM here with the page fields + candidate JSON to refine the mapping.
    # Example hook:
    # out = gpt_refine_mapping(fields, c, out)

    return {"mapping": out}, 200
