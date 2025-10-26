// src/constants/options.js
export const OTHER = "__OTHER__";

export const GENDER_OPTIONS = [
  "Male", "Female", "Non-binary", "Prefer not to say", OTHER
];

export const CITIZENSHIP_OPTIONS = [
  "Citizen", "Permanent Resident", "Non-Resident", OTHER
];

export const VISA_OPTIONS = [
  "None", "F1", "Citizen", "Green card (GC)", "GC-EAD", "H1B", "H4", "L1", "J1", OTHER
];

export const F1_TYPE_OPTIONS = [
  "Post OPT", "STEM OPT"
];

export const WORK_AUTH_OPTIONS = [
  "Authorized", "Needs Sponsorship", "Open to Sponsorship", OTHER
];

export const VETERAN_OPTIONS = [
  "Not a Veteran", "Veteran", "Prefer not to say"
];

export const RACE_ETHNICITY_OPTIONS = [
  "Asian", "Black or African American", "Hispanic or Latino",
  "White", "Native American or Alaska Native",
  "Native Hawaiian or Other Pacific Islander",
  "Two or more races", "Prefer not to say", OTHER
];

// Keep this list short for now—expand as needed
export const COUNTRY_OPTIONS = [
  "India", "United States", "United Kingdom", "Canada",
  "Australia", "Germany", "France", "Singapore", "United Arab Emirates", OTHER
];

export const SUBSCRIPTION_TYPE_OPTIONS = [
  "Gold", "Silver"
];

// If you want a STATE list, add here, else keep TextField for free input.
