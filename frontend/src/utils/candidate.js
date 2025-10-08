// src/utils/candidate.js
import { OTHER } from "../constants/options";

// Default values you asked for
export const DEFAULT_CANDIDATE = {
  // Personal (required according to your table)
  first_name: "", last_name: "", email: "", phone: "", birthdate: "",
  gender: "", nationality: "", citizenship_status: "", visa_status: "",
  work_authorization: "",
  willing_relocate: true,          // default true
  willing_travel: true,            // default true
  disability_status: false,        // default false
  veteran_status: "",
  military_experience: false,      // default false
  race_ethnicity: "",

  // Address (required)
  address_line1: "", address_line2: "",
  city: "", state: "", postal_code: "", country: "",

  // Online (optional)
  personal_website: "", linkedin: "", github: "",

  // Additional (required)
  technical_skills: "", work_experience: "",

  // “Other” free text mirrors (for selects with OTHER)
  gender_other_value: "",
  nationality_other_value: "",
  citizenship_other_value: "",
  visa_other_value: "",
  work_auth_other_value: "",
  race_other_value: "",
  country_other_value: "",
};

const required = [
  "first_name","last_name","email","phone","birthdate","gender",
  "nationality","citizenship_status","visa_status","work_authorization",
  "willing_relocate","willing_travel","disability_status","veteran_status",
  "military_experience","race_ethnicity",
  "address_line1","address_line2","city","state","postal_code","country",
  "technical_skills","work_experience"
];

export function validateCandidate(values) {
  const errors = {};

  // Required fields
  for (const k of required) {
    const v = values[k];
    // Note: booleans can be false and still valid
    if (v === undefined || v === null || v === "") {
      errors[k] = "Required";
    }
  }

  // Email
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Invalid email";
  }

  // URLs (optional but must be valid if present)
  const urlFields = ["personal_website", "linkedin", "github"];
  urlFields.forEach(f => {
    const v = values[f]?.trim();
    if (v && !/^https?:\/\/.+/i.test(v)) {
      errors[f] = "Must start with http(s)://";
    }
  });

  // If a select is OTHER, make sure the free-text is provided
  const otherPairs = [
    ["gender", "gender_other_value"],
    ["nationality", "nationality_other_value"],
    ["citizenship_status", "citizenship_other_value"],
    ["visa_status", "visa_other_value"],
    ["work_authorization", "work_auth_other_value"],
    ["race_ethnicity", "race_other_value"],
    ["country", "country_other_value"],
  ];
  for (const [field, otherField] of otherPairs) {
    if (values[field] === OTHER && !values[otherField]?.trim()) {
      errors[otherField] = "Please specify";
    }
  }

  // Birthdate must be YYYY-MM-DD
  if (values.birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(values.birthdate)) {
    errors.birthdate = "Use YYYY-MM-DD";
  }

  return errors;
}

// Turn OTHER selections into the typed free text;
// coerce booleans to true/false; trim strings.
export function normalizeCandidatePayload(values) {
  const out = { ...values };

  const otherPairs = [
    ["gender", "gender_other_value"],
    ["nationality", "nationality_other_value"],
    ["citizenship_status", "citizenship_other_value"],
    ["visa_status", "visa_other_value"],
    ["work_authorization", "work_auth_other_value"],
    ["race_ethnicity", "race_other_value"],
    ["country", "country_other_value"],
  ];
  for (const [field, otherField] of otherPairs) {
    if (out[field] === OTHER) out[field] = out[otherField]?.trim() || "";
    delete out[otherField];
  }

  // Coerce booleans (if any string slips through)
  ["willing_relocate","willing_travel","disability_status","military_experience"].forEach(k => {
    out[k] = (typeof out[k] === "string") ? out[k] === "true" : !!out[k];
  });

  // Trim strings
  Object.keys(out).forEach(k => {
    if (typeof out[k] === "string") out[k] = out[k].trim();
  });

  return out;
}
