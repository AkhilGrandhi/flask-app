export function fullName(obj) {
  // Prefer explicit first/last if you ever add them, else 'name', else email/mobile fallback
  const fn = obj?.first_name?.trim();
  const ln = obj?.last_name?.trim();
  const nm = obj?.name?.trim();
  const base = (fn || ln) ? [fn, ln].filter(Boolean).join(" ") : nm;
  return base || obj?.email || obj?.mobile || "User";
}

export function initials(obj) {
  // Build initials from first/last or name/email/mobile
  const fn = obj?.first_name?.trim();
  const ln = obj?.last_name?.trim();
  const nm = obj?.name?.trim();

  let a = "";
  let b = "";

  if (fn || ln) {
    a = (fn || "")[0] || "";
    b = (ln || "")[0] || "";
  } else if (nm) {
    const parts = nm.split(/\s+/);
    a = (parts[0] || "")[0] || "";
    b = (parts[parts.length - 1] || "")[0] || "";
    if (parts.length === 1) b = "";
  } else if (obj?.email) {
    a = obj.email[0];
  } else if (obj?.mobile) {
    a = obj.mobile[0];
  }

  return (a + b).toUpperCase() || "?";
}
