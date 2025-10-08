# backend/app/utils.py
from sqlalchemy.inspection import inspect as sa_inspect
from datetime import date, datetime

def model_to_dict(obj, *, exclude=None, rename=None):
    """
    Convert a SQLAlchemy model into a JSON-safe dict.
    - exclude: set/list of column names to skip
    - rename:  dict {old_name: new_name}
    """
    exclude = set(exclude or [])
    rename = rename or {}
    out = {}
    mapper = sa_inspect(obj).mapper

    for col in mapper.columns:
        key = col.key
        if key in exclude:
            continue
        val = getattr(obj, key)
        if isinstance(val, (date, datetime)):
            val = val.isoformat()
        out[rename.get(key, key)] = val
    return out
