/***********************
 * FORM COLLECTION
 ***********************/
function getFormData() {
  let data = {};
  document.querySelectorAll("input, textarea, select").forEach(el => {
    let key = el.name || el.id || el.type || `field_${Math.random().toString(36).substring(7)}`;
    let fieldType = "text";
    let fieldValue = null;
    let options = null;
    let labelText = getLabelText(el);

    if (el.tagName.toLowerCase() === "textarea") {
      fieldType = "paragraph";
      fieldValue = el.value;

    } else if (el.tagName.toLowerCase() === "select") {
      fieldType = "dropdown";
      fieldValue = el.value;
      options = Array.from(el.options).map(opt => opt.value);
      labelText = getLabelText(el, true);

    } else if (el.type === "checkbox") {
      fieldType = "checkbox";
      if (el.name) {
        if (!data[el.name]) {
          let group = document.querySelectorAll(`input[type="checkbox"][name="${el.name}"]`);
          let selected = Array.from(group).filter(c => c.checked).map(c => c.value);
          options = Array.from(group).map(c => c.value);
          let sample = group[0];
          let hasLabel = checkHasLabel(sample);
          let hasAutocomplete = sample.hasAttribute("autocomplete");
          let labelTextGroup = getGroupLabelText(sample, group);

          data[el.name] = {
            type: "checkbox-group",
            value: selected,
            options: options,
            hasLabel: hasLabel,
            hasAutocomplete: hasAutocomplete,
            isRequired: sample.required || false,
            label: labelTextGroup
          };
        }
        return;
      } else {
        fieldValue = el.checked;
      }

    } else if (el.type === "radio") {
      fieldType = "radio";
      if (el.name && !data[el.name]) {
        let group = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
        options = Array.from(group).map(r => r.value);
        let selected = Array.from(group).find(r => r.checked);
        fieldValue = selected ? selected.value : null;
        let sample = group[0];
        let hasLabel = checkHasLabel(sample);
        let hasAutocomplete = sample.hasAttribute("autocomplete");
        let labelTextGroup = getGroupLabelText(sample, group);
        data[el.name] = {
          type: "radio-group",
          value: fieldValue,
          options: options,
          hasLabel: hasLabel,
          hasAutocomplete: hasAutocomplete,
          label: labelTextGroup
        };
      }
      return;

    } else if (el.type === "number") {
      fieldType = "number";
      fieldValue = el.value;

    } else if (el.type === "date") {
      fieldType = "date";
      fieldValue = el.value;

    } else if (el.type === "datetime-local" || el.type === "time") {
      fieldType = "time";
      fieldValue = el.value;

    } else if (el.type === "email") {
      fieldType = "email";
      fieldValue = el.value;

    } else if (el.type === "url") {
      fieldType = "url";
      fieldValue = el.value;

    } else if (el.type === "file") {
      fieldType = "file";
      fieldValue = el.value;

    } else {
      fieldType = "text";
      fieldValue = el.value;
    }

    let hasLabel = checkHasLabel(el);
    let hasAutocomplete = el.hasAttribute("autocomplete");

    data[key] = {
      type: fieldType,
      value: fieldValue,
      ...(options ? { options: options } : {}),
      hasLabel: hasLabel,
      hasAutocomplete: hasAutocomplete,
      isRequired: el.required || false,
      label: labelText
    };
  });
  return data;
}

function checkHasLabel(el) {
  let hasLabel = false;
  if (el.id) {
    const label = document.querySelector(`label[for='${el.id}']`);
    if (label) hasLabel = true;
  }
  if (!hasLabel && el.closest("label")) {
    hasLabel = true;
  }
  return hasLabel;
}

function getDirectText(node) {
  let text = '';
  for (let child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent;
    }
  }
  return text.trim();
}

function getLabelText(el, isSelect = false) {
  let label = null;
  if (el.id) {
    label = document.querySelector(`label[for='${el.id}']`);
    if (label) return getDirectText(label);
  }
  if (el.hasAttribute('formcontrolname')) {
    const fcName = el.getAttribute('formcontrolname');
    label = document.querySelector(`label[for='${fcName}']`);
    if (label) return getDirectText(label);
  }
  let parentLabel = el.closest("label");
  if (parentLabel) return getDirectText(parentLabel);
  if (el.hasAttribute("aria-labelledby")) {
    let ids = el.getAttribute("aria-labelledby").split(" ");
    let texts = ids.map(id => {
      let node = document.getElementById(id);
      return node ? getDirectText(node) : "";
    });
    return texts.join(" ").trim();
  }
  if (isSelect) {
    let prev = el.previousElementSibling;
    while (prev && (prev.tagName === 'INPUT' || prev.tagName === 'SELECT' || prev.tagName === 'TEXTAREA')) {
      prev = prev.previousElementSibling;
    }
    if (prev) {
      if (prev.tagName && prev.tagName.toLowerCase() === 'label') {
        return getDirectText(prev);
      }
      if (prev.tagName && prev.tagName.toLowerCase() === 'div') {
        return getDirectText(prev);
      }
    }
  }
  let prev = el.previousElementSibling;
  while (prev && (prev.tagName === 'INPUT' || prev.tagName === 'SELECT' || prev.tagName === 'TEXTAREA')) {
    prev = prev.previousElementSibling;
  }
  if (prev && prev.tagName && prev.tagName.toLowerCase() === 'div') {
    return getDirectText(prev);
  }
  let container = el.parentElement;
  let depth = 0;
  while (container && depth < 3) {
    let labelLike = container.querySelector('label, .label, .form-label, .mat-form-field-label, .mat-mdc-form-field-label, .MuiFormLabel-root');
    if (labelLike && labelLike.innerText.trim()) return getDirectText(labelLike);
    let divLabel = container.querySelector('div.label, div.form-label');
    if (divLabel && divLabel.innerText.trim()) return getDirectText(divLabel);
    container = container.parentElement;
    depth++;
  }
  if (el.hasAttribute('aria-label')) return el.getAttribute('aria-label').trim();
  if (el.hasAttribute('placeholder')) return el.getAttribute('placeholder').trim();
  return null;
}

function getGroupLabelText(sample, group) {
  let fieldset = sample.closest('fieldset');
  if (fieldset) {
    let legend = fieldset.querySelector('legend');
    if (legend) return getDirectText(legend);
  }
  let first = group[0];
  let prev = first.previousElementSibling;
  while (prev && (prev.tagName === 'INPUT' || prev.tagName === 'SELECT' || prev.tagName === 'TEXTAREA')) {
    prev = prev.previousElementSibling;
  }
  if (prev) {
    if (prev.tagName && prev.tagName.toLowerCase() === 'label') {
      return getDirectText(prev);
    }
    if (prev.tagName && prev.tagName.toLowerCase() === 'div') {
      return getDirectText(prev);
    }
  }
  if (first.hasAttribute('formcontrolname')) {
    const fcName = first.getAttribute('formcontrolname');
    let label = document.querySelector(`label[for='${fcName}']`);
    if (label) return getDirectText(label);
  }
  if (first.parentElement && first.parentElement.hasAttribute('id')) {
    let groupId = first.parentElement.getAttribute('id');
    let label = document.querySelector(`label[for='${groupId}']`);
    if (label) return getDirectText(label);
  }
  let container = first.parentElement;
  let depth = 0;
  while (container && depth < 3) {
    let labelLike = container.querySelector('label, .label, .form-label, .mat-form-field-label, .mat-mdc-form-field-label, .MuiFormLabel-root');
    if (labelLike && labelLike.innerText.trim()) return getDirectText(labelLike);
    let divLabel = container.querySelector('div.label, div.form-label');
    if (divLabel && divLabel.innerText.trim()) return getDirectText(divLabel);
    container = container.parentElement;
    depth++;
  }
  let parentLabel = sample.closest('label');
  if (parentLabel) return getDirectText(parentLabel);
  if (sample.hasAttribute('aria-labelledby')) {
    let ids = sample.getAttribute('aria-labelledby').split(' ');
    let texts = ids.map(id => {
      let node = document.getElementById(id);
      return node ? getDirectText(node) : '';
    });
    return texts.join(' ').trim();
  }
  if (sample.hasAttribute('aria-label')) return sample.getAttribute('aria-label').trim();
  if (sample.hasAttribute('placeholder')) return sample.getAttribute('placeholder').trim();
  return null;
}

/***********************
 * ROBUST, GENERIC FILLER (new)
 ***********************/
function fire(el) {
  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur',   { bubbles: true }));
}

function findTargets(key) {
  const byName = document.querySelectorAll(`[name="${CSS.escape(key)}"]`);
  if (byName.length) return Array.from(byName);
  const byId = document.getElementById(key);
  return byId ? [byId] : [];
}

function parseDDMMYYYY(s) {
  const m = /^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})$/.exec(String(s || "").trim());
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function setSelect(el, value) {
  if (value == null) return false;
  const wanted = String(value).trim().toLowerCase();
  for (const opt of el.options) {
    const v = String(opt.value).trim().toLowerCase();
    const t = String(opt.textContent).trim().toLowerCase();
    if (wanted === v || wanted === t) {
      el.value = opt.value;
      fire(el);
      return true;
    }
  }
  return false;
}

function setRadioGroup(name, value) {
  const want = String(value).toLowerCase();
  const group = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`);
  if (!group.length) return false;
  let picked = false;
  for (const r of group) {
    const rv = String(r.value || r.id || "").toLowerCase();
    if (rv && rv === want) {
      r.checked = true;
      fire(r);
      picked = true;
      break;
    }
  }
  if (!picked) { group[0].checked = true; fire(group[0]); }
  return true;
}

function setCheckboxGroup(name, value) {
  const group = document.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]`);
  if (!group.length) return false;
  const arr = Array.isArray(value) ? value.map(v => String(v).toLowerCase()) : [String(value).toLowerCase()];
  group.forEach(cb => {
    const v = String(cb.value).toLowerCase();
    cb.checked = arr.includes(v) || arr.includes("true");
    fire(cb);
  });
  return true;
}

function setValue(el, value) {
  const tag = el.tagName.toLowerCase();
  const type = (el.getAttribute('type') || tag).toLowerCase();

  if (type === 'file') return false;

  if (type === 'checkbox') {
    const truthy = (value === true || value === 'true' || value === 1 || value === '1');
    el.checked = !!truthy;
    fire(el);
    return true;
  }

  if (tag === 'select') {
    if (!setSelect(el, value) && el.options.length && value !== "" && value != null) {
      el.selectedIndex = 0;
      fire(el);
    }
    return true;
  }

  if (type === "date") {
    let v = String(value || "").trim();
    // accept DD/MM/YYYY and ISO already
    const iso = parseDDMMYYYY(v) || v;
    el.value = iso;
    fire(el);
    return true;
  }

  el.value = value ?? "";
  fire(el);
  return true;
}

function fillFormGeneric(mapping) {
  let filled = 0;
  for (const [key, value] of Object.entries(mapping || {})) {
    // group types by name
    if (setRadioGroup(key, value)) { filled++; continue; }
    if (setCheckboxGroup(key, value)) { filled++; continue; }

    const targets = findTargets(key);
    if (!targets.length) continue;
    for (const el of targets) {
      try { if (setValue(el, value)) filled++; }
      catch (e) { console.warn("[content] fill failed", key, e); }
    }
  }
  return filled;
}

/***********************
 * MESSAGE HANDLER (single, unified)
 ***********************/
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  try {
    if (msg?.action === "collectFormData") {
      const formData = getFormData();
      sendResponse(formData);
      return true;
    }
    if (msg?.action === "autofillForm") {
      const mapping = msg.data || {};
      const count = fillFormGeneric(mapping);
      console.log("[content] autofilled fields:", count);
      sendResponse({ status: "success", filled: count });
      return true;
    }
    if (msg?.action === "logToConsole") {
      console.log("[content] candidate:", msg.payload?.candidate);
      console.log("[content] formSchema:", msg.payload?.formSchema);
      sendResponse({ ok: true });
      return true;
    }
  } catch (e) {
    console.error("[content] handler error:", e);
    sendResponse({ status: "error", error: String(e) });
    return true;
  }
});
