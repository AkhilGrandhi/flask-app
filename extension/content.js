function fillForm(data) {
    Object.keys(data).forEach(key => {
        const value = data[key];

        // Find all matching inputs/selects/checkboxes/radios by name or id
        const elements = document.querySelectorAll(`[name='${key}'], #${key}`);
        elements.forEach(el => {
            if (!el) return;

            if (el.tagName.toLowerCase() === "textarea" || el.tagName.toLowerCase() === "input" && el.type !== "checkbox" && el.type !== "radio" && el.type !== "file") {
                el.value = value;

            } else if (el.tagName.toLowerCase() === "select") {
                el.value = value;

            } else if (el.type === "radio") {
                const radios = document.querySelectorAll(`input[type="radio"][name='${key}']`);
                radios.forEach(r => r.checked = (r.value === value));

            } else if (el.type === "checkbox") {
                // value can be array or single
                if (Array.isArray(value)) {
                    el.checked = value.includes(el.value);
                } else {
                    el.checked = (el.value === value || value === true);
                }
            }
        });
    });

    // console.log("✅ Form autofilled with data:", data);
}


function getFormData() {
    let data = {};

    // Handle inputs, textareas, and selects
    document.querySelectorAll("input, textarea, select").forEach(el => {
        let key = el.name || el.id || el.type || `field_${Math.random().toString(36).substring(7)}`;
        let fieldType = "text";
        let fieldValue = null;
        let options = null;
        // Get the label text for this element
        let labelText = getLabelText(el);

        // ----------------------------
        // Handle <textarea>
        // ----------------------------
        if (el.tagName.toLowerCase() === "textarea") {
            fieldType = "paragraph";
            fieldValue = el.value;

        // ----------------------------
        // Handle <select> dropdown
        // ----------------------------
        } else if (el.tagName.toLowerCase() === "select") {
            fieldType = "dropdown";
            fieldValue = el.value;
            options = Array.from(el.options).map(opt => opt.value);
            // Try to get label for select
            labelText = getLabelText(el, true);

        // ----------------------------
        // Handle checkboxes
        // ----------------------------
        } else if (el.type === "checkbox") {
            fieldType = "checkbox";

            // If multiple checkboxes share the same name, treat as group
            if (el.name) {
                if (!data[el.name]) {
                    let group = document.querySelectorAll(`input[type="checkbox"][name="${el.name}"]`);
                    let selected = Array.from(group).filter(c => c.checked).map(c => c.value);
                    options = Array.from(group).map(c => c.value);

                    // Add accessibility info for group
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
                return; // Skip duplicate entries
            } else {
                fieldValue = el.checked;
            }

        // ----------------------------
        // Handle radio buttons
        // ----------------------------
        } else if (el.type === "radio") {
            fieldType = "radio";

            if (el.name && !data[el.name]) {
                let group = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
                options = Array.from(group).map(r => r.value);
                let selected = Array.from(group).find(r => r.checked);
                fieldValue = selected ? selected.value : null;

                // Add accessibility info for group
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
            return; // Skip duplicate radios

        // ----------------------------
        // Handle numbers, dates, times, emails, urls, files
        // ----------------------------
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

        // ----------------------------
        // Default text input
        // ----------------------------
        } else {
            fieldType = "text";
            fieldValue = el.value;
        }

        // ----------------------------
        // Accessibility checks
        // ----------------------------
        let hasLabel = checkHasLabel(el);
        let hasAutocomplete = el.hasAttribute("autocomplete");

        // Store result
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

    // console.log("📝 Collected form data with types + options:", data);
    return data;
}


// Helper: check if input has label
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


// Helper: get only the direct text content of a node (excluding children)
function getDirectText(node) {
    let text = '';
    for (let child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent;
        }
    }
    return text.trim();
}

// Helper: get the label text for an input/select element
function getLabelText(el, isSelect = false) {
    let label = null;
    // 1. Try id/for match
    if (el.id) {
        label = document.querySelector(`label[for='${el.id}']`);
        if (label) return getDirectText(label);
    }
    // 2. Try formcontrolname/for match (Angular)
    if (el.hasAttribute('formcontrolname')) {
        const fcName = el.getAttribute('formcontrolname');
        label = document.querySelector(`label[for='${fcName}']`);
        if (label) return getDirectText(label);
    }
    // 3. If wrapped in a <label>
    let parentLabel = el.closest("label");
    if (parentLabel) return getDirectText(parentLabel);
    // 4. Try aria-labelledby
    if (el.hasAttribute("aria-labelledby")) {
        let ids = el.getAttribute("aria-labelledby").split(" ");
        let texts = ids.map(id => {
            let node = document.getElementById(id);
            return node ? getDirectText(node) : "";
        });
        return texts.join(" ").trim();
    }
    // 5. For select, try to find a label or div immediately before
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
    // 6. For all, try to find a div immediately before
    let prev = el.previousElementSibling;
    while (prev && (prev.tagName === 'INPUT' || prev.tagName === 'SELECT' || prev.tagName === 'TEXTAREA')) {
        prev = prev.previousElementSibling;
    }
    if (prev && prev.tagName && prev.tagName.toLowerCase() === 'div') {
        return getDirectText(prev);
    }
    // 7. Search parent containers for label-like elements (up to 3 levels up)
    let container = el.parentElement;
    let depth = 0;
    while (container && depth < 3) {
        // Look for label-like elements
        let labelLike = container.querySelector('label, .label, .form-label, .mat-form-field-label, .mat-mdc-form-field-label, .MuiFormLabel-root');
        if (labelLike && labelLike.innerText.trim()) return getDirectText(labelLike);
        // Look for a div with label-like class
        let divLabel = container.querySelector('div.label, div.form-label');
        if (divLabel && divLabel.innerText.trim()) return getDirectText(divLabel);
        container = container.parentElement;
        depth++;
    }
    // 8. Fallback: aria-label or placeholder
    if (el.hasAttribute('aria-label')) return el.getAttribute('aria-label').trim();
    if (el.hasAttribute('placeholder')) return el.getAttribute('placeholder').trim();
    return null;
}

// Helper: get the label text for a group of radios/checkboxes
function getGroupLabelText(sample, group) {
    // Try fieldset > legend
    let fieldset = sample.closest('fieldset');
    if (fieldset) {
        let legend = fieldset.querySelector('legend');
        if (legend) return getDirectText(legend);
    }
    // Try label or div before the first element
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
    // Try formcontrolname/for match (Angular)
    if (first.hasAttribute('formcontrolname')) {
        const fcName = first.getAttribute('formcontrolname');
        let label = document.querySelector(`label[for='${fcName}']`);
        if (label) return getDirectText(label);
    }
    // Try id/for match on group container
    if (first.parentElement && first.parentElement.hasAttribute('id')) {
        let groupId = first.parentElement.getAttribute('id');
        let label = document.querySelector(`label[for='${groupId}']`);
        if (label) return getDirectText(label);
    }
    // Search parent containers for label-like elements (up to 3 levels up)
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
    // Try parent label
    let parentLabel = sample.closest('label');
    if (parentLabel) return getDirectText(parentLabel);
    // Try aria-labelledby
    if (sample.hasAttribute('aria-labelledby')) {
        let ids = sample.getAttribute('aria-labelledby').split(' ');
        let texts = ids.map(id => {
            let node = document.getElementById(id);
            return node ? getDirectText(node) : '';
        });
        return texts.join(' ').trim();
    }
    // Fallback: aria-label or placeholder
    if (sample.hasAttribute('aria-label')) return sample.getAttribute('aria-label').trim();
    if (sample.hasAttribute('placeholder')) return sample.getAttribute('placeholder').trim();
    return null;
}

// Listen for messages from popup.js

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // console.log("📩 Message received in content.js:", msg);

    if (msg.action === "collectFormData") {
        let formData = getFormData();
        // console.log("📤 Sending collected data back:", formData);
        sendResponse(formData);

    } else if (msg.action === "autofillForm") {
        fillForm(msg.data);  // your autofill function
        // console.log("✅ Form autofilled with data:", msg.data);
        sendResponse({status: "success"});
    }
});


// ... your existing functions fillForm, getFormData, helpers ...

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // console.log("📩 Message received in content.js:", msg);

    if (msg.action === "collectFormData") {
        let formData = getFormData();
        // console.log("📤 Sending collected data back:", formData);
        sendResponse(formData);

    } else if (msg.action === "autofillForm") {
        fillForm(msg.data);  // your autofill function
        // console.log("✅ Form autofilled with data:", msg.data);
        sendResponse({status: "success"});

    } else if (msg.action === "mapAndAutofill") {
        // Step 1: collect form structure
        let formData = getFormData();

        // Step 2: send to backend /gpt-map
        fetch("http://127.0.0.1:5000/gpt-map", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ form: formData })
        })
        .then(res => res.json())
        .then(mapped => {
            // Step 3: auto fill using GPT’s mapping
            fillForm(mapped);
            // console.log("✅ Autofilled with GPT mapping:", mapped);
            sendResponse({ status: "success", data: mapped });
        })
        .catch(err => {
            console.error("❌ Error calling /gpt-map:", err);
            sendResponse({ status: "error", error: err.toString() });
        });

        return true; // keep async channel open for fetch
    }
});
