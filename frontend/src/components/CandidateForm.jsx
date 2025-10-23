// src/components/CandidateForm.jsx
import { useMemo, useId } from "react";
import {
  Box, Grid, Paper, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, FormHelperText
} from "@mui/material";
import {
  OTHER, GENDER_OPTIONS, CITIZENSHIP_OPTIONS, VISA_OPTIONS,
  WORK_AUTH_OPTIONS, VETERAN_OPTIONS, RACE_ETHNICITY_OPTIONS,
  COUNTRY_OPTIONS
} from "../constants/options";

// Reusable, wide, label-friendly select
function RequiredSelect({ label, value, onChange, options, error, helperText, name }) {
  const labelId = useId();
  return (
    <FormControl
      fullWidth
      required
      error={!!error}
      size="small"
      sx={{ width: "100%", minWidth: 280 }}   // keep a sensible min width
    >
      <InputLabel
        id={labelId}
        shrink                                   // keep label above the field
        sx={{ whiteSpace: "normal", lineHeight: 1.2, maxWidth: "100%" }} // wrap long labels
      >
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        label={label}
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        sx={{ width: "100%" }}
        MenuProps={{
          PaperProps: { sx: { minWidth: 300, maxHeight: 320 } }, // nicer dropdown
        }}
      >
        {options.map((opt) => (
          <MenuItem key={String(opt)} value={opt}>
            {opt === "__OTHER__" ? "Other" : String(opt)}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{error || helperText}</FormHelperText>
    </FormControl>
  );
}

export default function CandidateForm({ value, onChange, errors = {} }) {
  const v = useMemo(() => value || {}, [value]);

  const set = (k) => (eOrVal) => {
    const newVal = eOrVal?.target ? eOrVal.target.value : eOrVal;
    onChange({ ...v, [k]: newVal });
  };

  return (
    <Box sx={{ display: "grid", gap: 2, "& .MuiFormControl-root": { width: "100%" } }}>
      {/* PERSONAL */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Personal Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField size="small" label="First Name" value={v.first_name||""} onChange={set("first_name")}
              required fullWidth error={!!errors.first_name} helperText={errors.first_name}/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField size="small" label="Last Name" value={v.last_name||""} onChange={set("last_name")}
              required fullWidth error={!!errors.last_name} helperText={errors.last_name}/>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField size="small" type="email" label="Email" value={v.email||""} onChange={set("email")}
              required fullWidth error={!!errors.email} helperText={errors.email}/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField size="small" label="Phone" value={v.phone||""} onChange={set("phone")}
              required fullWidth error={!!errors.phone} helperText={errors.phone}/>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField size="small" label="Birthdate" type="date" InputLabelProps={{shrink:true}}
              value={v.birthdate||""} onChange={set("birthdate")}
              required fullWidth error={!!errors.birthdate} helperText={errors.birthdate}/>
          </Grid>

          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Gender" value={v.gender} onChange={set("gender")}
              options={GENDER_OPTIONS} error={errors.gender}/>
          </Grid>
          {v.gender === OTHER && (
            <Grid item xs={12}>
              <TextField size="small" label="Please specify gender" value={v.gender_other_value||""}
                onChange={set("gender_other_value")} required fullWidth
                error={!!errors.gender_other_value} helperText={errors.gender_other_value}/>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Nationality" value={v.nationality ?? "India"} onChange={set("nationality")}
              options={COUNTRY_OPTIONS} error={errors.nationality}/>
          </Grid>
          {v.nationality === OTHER && (
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Specify Nationality" value={v.nationality_other_value||""}
                onChange={set("nationality_other_value")} required fullWidth
                error={!!errors.nationality_other_value} helperText={errors.nationality_other_value}/>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Citizenship Status" value={v.citizenship_status ?? "Non-Resident"} onChange={set("citizenship_status")}
              options={CITIZENSHIP_OPTIONS} error={errors.citizenship_status}/>
          </Grid>
          {v.citizenship_status === OTHER && (
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Specify Citizenship" value={v.citizenship_other_value||""}
                onChange={set("citizenship_other_value")} required fullWidth
                error={!!errors.citizenship_other_value} helperText={errors.citizenship_other_value}/>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Visa Status" value={v.visa_status} onChange={set("visa_status")}
              options={VISA_OPTIONS} error={errors.visa_status}/>
          </Grid>
          {v.visa_status === OTHER && (
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Specify Visa" value={v.visa_other_value||""}
                onChange={set("visa_other_value")} required fullWidth
                error={!!errors.visa_other_value} helperText={errors.visa_other_value}/>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Work Authorization" value={v.work_authorization} onChange={set("work_authorization")}
              options={WORK_AUTH_OPTIONS} error={errors.work_authorization}/>
          </Grid>
          {v.work_authorization === OTHER && (
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Specify Work Authorization" value={v.work_auth_other_value||""}
                onChange={set("work_auth_other_value")} required fullWidth
                error={!!errors.work_auth_other_value} helperText={errors.work_auth_other_value}/>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Willing to Relocate" value={v.willing_relocate ?? "Yes"}
              onChange={(val)=>onChange({...v, willing_relocate: val})}
              options={["Yes","No"]} error={errors.willing_relocate}/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Willing to Travel" value={v.willing_travel ?? "Yes"}
              onChange={(val)=>onChange({...v, willing_travel: val})}
              options={["Yes","No"]} error={errors.willing_travel}/>
          </Grid>

          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Disability Status" value={v.disability_status ?? "No"}
              onChange={(val)=>onChange({...v, disability_status: val})}
              options={["Yes","No"]} error={errors.disability_status}/>
          </Grid>

          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Veteran Status" value={v.veteran_status ?? "Not a Veteran"} onChange={set("veteran_status")}
              options={VETERAN_OPTIONS} error={errors.veteran_status}/>
          </Grid>

          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Military Experience" value={v.military_experience ?? "No"}
              onChange={(val)=>onChange({...v, military_experience: val})}
              options={["Yes","No"]} error={errors.military_experience}/>
          </Grid>

          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Race / Ethnicity" value={v.race_ethnicity ?? "Asian"} onChange={set("race_ethnicity")}
              options={RACE_ETHNICITY_OPTIONS} error={errors.race_ethnicity}/>
          </Grid>
          {v.race_ethnicity === OTHER && (
            <Grid item xs={12}>
              <TextField size="small" label="Specify Race/Ethnicity" value={v.race_other_value||""}
                onChange={set("race_other_value")} required fullWidth
                error={!!errors.race_other_value} helperText={errors.race_other_value}/>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
          <RequiredSelect label="Are you at least 18 years of age?" 
            value={v.at_least_18 ?? "Yes"} 
            onChange={set("at_least_18")}
            options={["Yes","No"]} 
            error={errors.at_least_18}/>
          </Grid>
        </Grid>

        
        {/* Extra personal questions (2 per row) */}
      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={12} sm={6}>
          <TextField size="small" label="Expected Salary / Hourly Wage"
            value={v.expected_wage||""} onChange={set("expected_wage")} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField size="small" label="May we contact your current employer?"
            value={v.contact_current_employer||""} onChange={set("contact_current_employer")} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField size="small" label="Most Recent Degree / Qualification"
            value={v.recent_degree||""} onChange={set("recent_degree")} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField size="small" label="Legally authorized to work in the U.S.?"
            value={v.authorized_work_us||""} onChange={set("authorized_work_us")} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField size="small" label="Authorized to work without sponsorship?"
            value={v.authorized_without_sponsorship||""} onChange={set("authorized_without_sponsorship")} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField size="small" label="How did you learn about this opportunity?"
            value={v.referral_source||""} onChange={set("referral_source")} fullWidth />
        </Grid>

        

        <Grid item xs={12} sm={6}>
          <TextField size="small" label="Require visa sponsorship now or in future?"
            value={v.needs_visa_sponsorship||""} onChange={set("needs_visa_sponsorship")} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField size="small" label="Family member employed with our organization?"
            value={v.family_in_org||""} onChange={set("family_in_org")} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField size="small" label="Availability to start"
            value={v.availability||""} onChange={set("availability")} fullWidth />
        </Grid>
      </Grid>
      </Paper>

      {/* ADDRESS */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Address Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField size="small" label="Address Line 1" value={v.address_line1||""} onChange={set("address_line1")}
              required fullWidth error={!!errors.address_line1} helperText={errors.address_line1}/>
          </Grid>
          <Grid item xs={12}>
            <TextField size="small" label="Address Line 2" value={v.address_line2||""} onChange={set("address_line2")}
              required fullWidth error={!!errors.address_line2} helperText={errors.address_line2}/>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" label="City" value={v.city||""} onChange={set("city")}
              required fullWidth error={!!errors.city} helperText={errors.city}/>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" label="State / Province" value={v.state||""} onChange={set("state")}
              required fullWidth error={!!errors.state} helperText={errors.state}/>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" label="Postal Code" value={v.postal_code||""} onChange={set("postal_code")}
              required fullWidth error={!!errors.postal_code} helperText={errors.postal_code}/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <RequiredSelect label="Country" value={v.country ?? "India"} onChange={set("country")}
              options={COUNTRY_OPTIONS} error={errors.country}/>
          </Grid>
          {v.country === OTHER && (
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Specify Country" value={v.country_other_value||""}
                onChange={set("country_other_value")} required fullWidth
                error={!!errors.country_other_value} helperText={errors.country_other_value}/>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* ONLINE */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Online Presence</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField size="small" type="url" label="Personal Website" value={v.personal_website||""} onChange={set("personal_website")}
              fullWidth error={!!errors.personal_website} helperText={errors.personal_website}/>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" type="url" label="LinkedIn" value={v.linkedin||""} onChange={set("linkedin")}
              fullWidth error={!!errors.linkedin} helperText={errors.linkedin}/>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" type="url" label="GitHub" value={v.github||""} onChange={set("github")}
              fullWidth error={!!errors.github} helperText={errors.github}/>
          </Grid>
        </Grid>
      </Paper>

      {/* ADDITIONAL */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Additional Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField size="small" label="Technical Skills" value={v.technical_skills||""} onChange={set("technical_skills")}
              required fullWidth multiline minRows={3}
              error={!!errors.technical_skills} helperText={errors.technical_skills}/>
          </Grid>
          <Grid item xs={12}>
            <TextField size="small" label="Work Experience" value={v.work_experience||""} onChange={set("work_experience")}
              required fullWidth multiline minRows={3}
              error={!!errors.work_experience} helperText={errors.work_experience}/>
          </Grid>
          <Grid item xs={12}>
          <TextField size="small" label="Education"
            value={v.education||""} onChange={set("education")}
            fullWidth multiline minRows={3}/>
        </Grid>
        <Grid item xs={12}>
          <TextField size="small" label="Certificates"
            value={v.certificates||""} onChange={set("certificates")}
            fullWidth multiline minRows={3}/>
        </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
