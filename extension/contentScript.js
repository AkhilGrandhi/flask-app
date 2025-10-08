function scanFields() {
  console.log("[cs] scanFields()");
  const els = Array.from(document.querySelectorAll('input, select, textarea'));
  const fields = [];
  for (const el of els) {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const type = (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase();
    const id = el.id || "";
    const name = el.name || "";
    const placeholder = el.placeholder || "";
    let label = "";
    if (id) {
      const lab = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      label = lab?.innerText?.trim() || "";
    }
    if (!label) {
      const wrapLabel = el.closest("label");
      label = wrapLabel?.innerText?.trim() || "";
    }
    if (!label) {
      const prev = el.closest("div, span, p, td, th")?.querySelector("label");
      label = prev?.innerText?.trim() || "";
    }
    let options = undefined;
    if (el.tagName.toLowerCase() === "select") {
      options = Array.from(el.options).map(o => ({ value: o.value, text: o.textContent.trim() }));
    } else if (type === "radio") {
      const group = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`);
      options = Array.from(group).map(r => ({ value: r.value || r.id || r.name, text: r.value || r.id || r.name }));
    }
    fields.push({ id, name, type, placeholder, label, options });
  }
  console.log("[cs] fields found:", fields.length, fields);
  return fields;
}

function setNativeValue(el, value) {
  const last = el.value;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  if (last !== value) el.dispatchEvent(new Event('blur', { bubbles: true }));
}

function fillField(field, value) {
  let el = null;
  if (field.id) el = document.getElementById(field.id);
  if (!el && field.name) el = document.querySelector(`[name="${CSS.escape(field.name)}"]`);
  if (!el) return false;

  const type = (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase();
  console.log("[cs] fillField", { field, value, type });

  if (type === "checkbox") {
    const boolVal = (value === true || value === "true" || value === 1 || value === "1");
    el.checked = !!boolVal;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  if (type === "radio") {
    const group = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`);
    for (const r of group) {
      if (String(r.value).toLowerCase() === String(value).toLowerCase() ||
          String(r.id).toLowerCase() === String(value).toLowerCase()) {
        r.checked = true;
        r.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    if (group.length) { group[0].checked = true; group[0].dispatchEvent(new Event('change', { bubbles: true })); }
    return true;
  }
  if (el.tagName.toLowerCase() === "select") {
    const wanted = String(value).toLowerCase();
    for (const opt of el.options) {
      const ov = String(opt.value).toLowerCase();
      const ot = String(opt.textContent).trim().toLowerCase();
      if (ov === wanted || ot === wanted) {
        el.value = opt.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    if (el.options.length) {
      el.selectedIndex = 0;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }
  setNativeValue(el, value);
  return true;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log("[cs] onMessage:", msg);
  if (msg?.type === "SCAN_FIELDS") {
    const fields = scanFields();
    sendResponse({ fields });
    return true;
  }
  if (msg?.type === "FILL_FIELDS") {
    const { mapping } = msg;
    const fields = scanFields();
    const index = {};
    for (const f of fields) {
      if (f.name) index[f.name] = f;
      if (f.id) index[f.id] = f;
    }
    let count = 0;
    for (const key of Object.keys(mapping)) {
      const field = index[key];
      if (field) { if (fillField(field, mapping[key])) count++; }
    }
    console.log("[cs] filled count:", count);
    sendResponse({ filled: count });
    return true;
  }
});
