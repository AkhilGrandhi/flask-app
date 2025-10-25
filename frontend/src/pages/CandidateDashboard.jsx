import { useEffect, useState, useId } from "react";
import {
  Container, Box, Typography, Paper, Table, TableHead,
  TableRow, TableCell, TableBody, Button, Avatar, Stack, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Divider, TextField, Alert,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from "@mui/material";
import {
  PersonOutline, EmailOutlined, PhoneOutlined,
  WorkOutlineOutlined, VisibilityOutlined, Download, WorkspacePremium, Add
} from "@mui/icons-material";
import { useAuth } from "../AuthContext";
import { getMyCandidateProfile, updateMyCandidateProfile, addCandidateJob, generateResume, deleteCandidateJob } from "../api";
import {
  OTHER, GENDER_OPTIONS, CITIZENSHIP_OPTIONS, VISA_OPTIONS,
  WORK_AUTH_OPTIONS, VETERAN_OPTIONS, RACE_ETHNICITY_OPTIONS,
  COUNTRY_OPTIONS
} from "../constants/options";

// EditSelectField component for the edit form
function EditSelectField({ label, value, onChange, options }) {
  const labelId = useId();
  return (
    <FormControl 
      fullWidth 
      variant="outlined"
      sx={{ minWidth: 280 }}
    >
      <InputLabel 
        id={labelId} 
        shrink
        sx={{ whiteSpace: "normal", lineHeight: 1.2, maxWidth: "100%" }}
      >
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        sx={{ 
          width: "100%",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.23)",
          }
        }}
        MenuProps={{
          PaperProps: { 
            sx: { 
              minWidth: 300, 
              maxHeight: 320,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
            } 
          },
        }}
      >
        {options.map((opt) => (
          <MenuItem 
            key={String(opt)} 
            value={opt}
            sx={{
              "&:hover": {
                backgroundColor: "primary.light",
                color: "primary.contrastText"
              }
            }}
          >
            {opt === "__OTHER__" ? "Other" : String(opt)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState("");
  
  // Generate Resume state (for Silver subscribers)
  const [jobId, setJobId] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyCandidateProfile();
      setCandidate(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownloadResume = (job) => {
    if (!job.resume_content) {
      setError("No resume content available to download");
      return;
    }

    try {
      // Create a Blob with the resume content in a format that Word can open
      const content = `${candidate.first_name} ${candidate.last_name} - Resume
Job ID: ${job.job_id}
Generated: ${new Date(job.created_at).toLocaleDateString()}

${job.resume_content}`;

      const blob = new Blob([content], { type: 'application/msword' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidate.first_name}_${candidate.last_name}_Resume_${job.job_id}.doc`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Error downloading resume:", e);
      setError("Failed to download resume: " + e.message);
    }
  };

  // Format candidate info for resume generation (Silver subscribers)
  const formatCandidateInfo = (candidate) => {
    let info = `Name: ${candidate.first_name} ${candidate.last_name}\n`;
    info += `Email: ${candidate.email}\n`;
    info += `Phone: ${candidate.phone}\n\n`;
    
    if (candidate.technical_skills) {
      info += `Technical Skills:\n${candidate.technical_skills}\n\n`;
    }
    
    if (candidate.work_experience) {
      info += `Work Experience:\n${candidate.work_experience}\n\n`;
    }
    
    if (candidate.education) {
      info += `Education:\n${candidate.education}\n\n`;
    }
    
    if (candidate.certificates) {
      info += `Certifications:\n${candidate.certificates}\n\n`;
    }
    
    return info;
  };

  // Generate resume (Silver subscribers only)
  const handleGenerateResume = async () => {
    let jobRowId = null;
    try {
      setGenerateError("");
      setGenerating(true);
      
      // Step 1: Create job record FIRST to get job_row_id
      const response = await addCandidateJob(candidate.id, { job_id: jobId, job_description: jobDesc });
      jobRowId = response.id; // Store the job ID for cleanup if needed
      
      // Step 2: Generate resume with job_row_id so content gets saved to database
      const candidateInfo = formatCandidateInfo(candidate);
      const blob = await generateResume(jobDesc, candidateInfo, "word", candidate.id, jobRowId);
      
      // Step 3: Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidate.first_name}_${candidate.last_name}_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setJobId(""); 
      setJobDesc("");
      await load();
    } catch (e) { 
      setGenerateError(e.message);
      
      // If resume generation failed after creating job, delete the job record
      if (jobRowId) {
        try {
          await deleteCandidateJob(candidate.id, jobRowId);
          console.log("Cleaned up job record after resume generation failure");
        } catch (cleanupError) {
          console.error("Failed to cleanup job record:", cleanupError);
        }
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        mb: 3,
        pb: 2,
        borderBottom: "2px solid",
        borderColor: "primary.main"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <img 
            src="/only_logo.png" 
            alt="Data Fyre Logo" 
            style={{ height: "60px", width: "auto", objectFit: "contain" }}
          />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              My Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome back, {candidate?.first_name}!
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ textAlign: "right", mr: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
              Candidate Portal
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {candidate?.first_name} {candidate?.last_name}
            </Typography>
          </Box>
          <Avatar sx={{ 
            width: 48, 
            height: 48, 
            bgcolor: "primary.main", 
            fontSize: "1.2rem",
            fontWeight: 600
          }}>
            {candidate?.first_name?.[0]}{candidate?.last_name?.[0]}
          </Avatar>
          <Button onClick={logout} variant="outlined" color="error">
            Logout
          </Button>
        </Stack>
      </Box>

      {/* Profile Overview Card */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
        <Box sx={{ 
          px: 2.5,
          py: 2, 
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
            Profile Overview
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityOutlined />}
              onClick={() => setDetailsOpen(true)}
              sx={{ textTransform: "none" }}
            >
              View Full Details
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setEditForm(candidate);
                setEditError("");
                setEditOpen(true);
              }}
              sx={{ textTransform: "none" }}
            >
              Edit Details
            </Button>
          </Stack>
        </Box>

        <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", gap: 3 }}>
          {/* Full Name */}
          <Box sx={{ display: "flex", alignItems: "center", flex: "1", minWidth: 0 }}>
            <Avatar sx={{ bgcolor: "primary.main", mr: 1.5, width: 36, height: 36, flexShrink: 0 }}>
              <PersonOutline sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Full Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {candidate?.first_name} {candidate?.last_name}
              </Typography>
            </Box>
          </Box>

          {/* Email Address */}
          <Box sx={{ display: "flex", alignItems: "center", flex: "1", minWidth: 0 }}>
            <Avatar sx={{ bgcolor: "success.main", mr: 1.5, width: 36, height: 36, flexShrink: 0 }}>
              <EmailOutlined sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Email Address
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {candidate?.email || "Not provided"}
              </Typography>
            </Box>
          </Box>

          {/* Mobile Number */}
          <Box sx={{ display: "flex", alignItems: "center", flex: "1", minWidth: 0 }}>
            <Avatar sx={{ bgcolor: "warning.main", mr: 1.5, width: 36, height: 36, flexShrink: 0 }}>
              <PhoneOutlined sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Mobile Number
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {candidate?.phone || "Not provided"}
              </Typography>
            </Box>
          </Box>

          {/* Subscription Type */}
          <Box sx={{ display: "flex", alignItems: "center", flex: "1", minWidth: 0 }}>
            <Avatar sx={{ 
              bgcolor: candidate?.subscription_type === "Gold" ? "#FFD700" : candidate?.subscription_type === "Silver" ? "#C0C0C0" : "info.main",
              mr: 1.5, 
              width: 36, 
              height: 36,
              flexShrink: 0,
              boxShadow: candidate?.subscription_type === "Gold" ? "0 0 12px rgba(255, 215, 0, 0.5)" : candidate?.subscription_type === "Silver" ? "0 0 12px rgba(192, 192, 192, 0.5)" : "none"
            }}>
              <WorkspacePremium sx={{ fontSize: 20, color: candidate?.subscription_type ? "white" : undefined }} />
            </Avatar>
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Subscription Type
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: "0.95rem",
                  color: candidate?.subscription_type === "Gold" ? "#FFD700" : candidate?.subscription_type === "Silver" ? "#757575" : "text.primary",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {candidate?.subscription_type === "Gold" && "🥇 "}
                {candidate?.subscription_type === "Silver" && "🥈 "}
                {candidate?.subscription_type || "Not provided"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Generate Resume Section - Only for Silver Subscribers */}
      {candidate?.subscription_type === "Silver" && (
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden", mb: 3, border: "2px solid #C0C0C0" }}>
          <Box sx={{ 
            px: 2.5,
            py: 2, 
            bgcolor: "#f5f5f5",
            borderBottom: "2px solid #C0C0C0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem", color: "#757575" }}>
              🚀 Generate Resume
            </Typography>
            <Button 
              variant="contained" 
              size="small"
              onClick={handleGenerateResume} 
              disabled={generating || !jobId || !jobDesc}
              startIcon={generating ? <CircularProgress size={14} color="inherit" /> : <Add />}
              sx={{ 
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                bgcolor: "#757575",
                "&:hover": { bgcolor: "#616161" },
                "&.Mui-disabled": {
                  bgcolor: "#e0e0e0",
                  color: "#9e9e9e"
                }
              }}
            >
              {generating ? "Generating..." : "+ Generate"}
            </Button>
          </Box>
          
          <Box sx={{ p: 3 }}>
            {generateError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGenerateError("")}>
                {generateError}
              </Alert>
            )}
            
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              <Box sx={{ width: "30%" }}>
                <TextField
                  label="Job ID"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  fullWidth
                  disabled={generating}
                  required
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box sx={{ width: "70%" }}>
                <TextField
                  label="Job Description"
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  disabled={generating}
                  required
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 500 }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Jobs Applied Section */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ 
          px: 2.5,
          py: 2, 
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
            Jobs Applied
          </Typography>
          {candidate?.jobs && candidate.jobs.length > 0 && (
            <Chip
              label={`${candidate.jobs.length} Application${candidate.jobs.length !== 1 ? 's' : ''}`}
              color="primary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {candidate?.jobs && candidate.jobs.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Job ID</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Job Description</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Resume Content</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Applied Date</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.25 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidate.jobs.map((job) => (
                <TableRow 
                  key={job.id} 
                  hover
                  sx={{ 
                    "&:hover": { bgcolor: "primary.lighter" },
                    "& td": { py: 1.5 }
                  }}
                >
                  <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600, color: "primary.main" }}>
                    {job.job_id}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2">
                      {job.job_description.length > 80
                        ? job.job_description.substring(0, 80) + "..."
                        : job.job_description}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    {job.resume_content ? (
                      <Typography variant="body2" color="text.secondary">
                        {job.resume_content.length > 60
                          ? job.resume_content.substring(0, 60) + "..."
                          : job.resume_content}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Not generated
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {job.resume_content ? (
                        <Chip label="Generated" color="success" size="small" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Chip label="Pending" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      )}
                      {job.resume_content && (
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<Download />}
                          onClick={() => handleDownloadResume(job)}
                          sx={{ 
                            textTransform: "none", 
                            fontWeight: 500,
                            minWidth: "auto",
                            px: 1
                          }}
                        >
                          Download
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                    {new Date(job.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedJob(job);
                        setResumeOpen(true);
                      }}
                      sx={{ textTransform: "none", fontWeight: 500 }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: "auto", 
              mb: 2,
              bgcolor: "primary.lighter"
            }}>
              <WorkOutlineOutlined sx={{ fontSize: 40, color: "primary.main" }} />
            </Avatar>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              No Jobs Applied Yet
            </Typography>
            <Typography color="text.secondary">
              You haven't applied to any jobs yet. Check back later!
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Edit Details Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Edit Profile Details
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Update your personal information
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: "grey.50" }}>
          {editError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {editError}
            </Alert>
          )}
          <Box sx={{ display: "grid", gap: 3 }}>
            {/* Personal Information */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600, color: "primary.main" }}>
                Personal Information
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="First Name"
                    value={editForm.first_name || ""}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    fullWidth
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Last Name"
                    value={editForm.last_name || ""}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    fullWidth
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Birthdate"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={editForm.birthdate || ""}
                    onChange={(e) => setEditForm({ ...editForm, birthdate: e.target.value })}
                    fullWidth
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Gender"
                    value={editForm.gender}
                    onChange={(val) => setEditForm({ ...editForm, gender: val })}
                    options={GENDER_OPTIONS}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Nationality"
                    value={editForm.nationality}
                    onChange={(val) => setEditForm({ ...editForm, nationality: val })}
                    options={COUNTRY_OPTIONS}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Citizenship Status"
                    value={editForm.citizenship_status}
                    onChange={(val) => setEditForm({ ...editForm, citizenship_status: val })}
                    options={CITIZENSHIP_OPTIONS}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Visa Status"
                    value={editForm.visa_status}
                    onChange={(val) => setEditForm({ ...editForm, visa_status: val })}
                    options={VISA_OPTIONS}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Work Authorization"
                    value={editForm.work_authorization}
                    onChange={(val) => setEditForm({ ...editForm, work_authorization: val })}
                    options={WORK_AUTH_OPTIONS}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Willing to Relocate"
                    value={editForm.willing_relocate}
                    onChange={(val) => setEditForm({ ...editForm, willing_relocate: val })}
                    options={["Yes", "No"]}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Willing to Travel"
                    value={editForm.willing_travel}
                    onChange={(val) => setEditForm({ ...editForm, willing_travel: val })}
                    options={["Yes", "No"]}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Disability Status"
                    value={editForm.disability_status}
                    onChange={(val) => setEditForm({ ...editForm, disability_status: val })}
                    options={["Yes", "No"]}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Veteran Status"
                    value={editForm.veteran_status}
                    onChange={(val) => setEditForm({ ...editForm, veteran_status: val })}
                    options={VETERAN_OPTIONS}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Military Experience"
                    value={editForm.military_experience}
                    onChange={(val) => setEditForm({ ...editForm, military_experience: val })}
                    options={["Yes", "No"]}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Race / Ethnicity"
                    value={editForm.race_ethnicity}
                    onChange={(val) => setEditForm({ ...editForm, race_ethnicity: val })}
                    options={RACE_ETHNICITY_OPTIONS}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="At least 18 years of age?"
                    value={editForm.at_least_18}
                    onChange={(val) => setEditForm({ ...editForm, at_least_18: val })}
                    options={["Yes", "No"]}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Family member employed here?"
                    value={editForm.family_in_org}
                    onChange={(val) => setEditForm({ ...editForm, family_in_org: val })}
                    options={["Yes", "No"]}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Expected Salary / Hourly Wage"
                    value={editForm.expected_wage || ""}
                    onChange={(e) => setEditForm({ ...editForm, expected_wage: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="May we contact your current employer?"
                    value={editForm.contact_current_employer || ""}
                    onChange={(e) => setEditForm({ ...editForm, contact_current_employer: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Most Recent Degree / Qualification"
                    value={editForm.recent_degree || ""}
                    onChange={(e) => setEditForm({ ...editForm, recent_degree: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Legally authorized to work in the U.S.?"
                    value={editForm.authorized_work_us || ""}
                    onChange={(e) => setEditForm({ ...editForm, authorized_work_us: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Authorized to work without sponsorship?"
                    value={editForm.authorized_without_sponsorship || ""}
                    onChange={(e) => setEditForm({ ...editForm, authorized_without_sponsorship: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="How did you learn about this opportunity?"
                    value={editForm.referral_source || ""}
                    onChange={(e) => setEditForm({ ...editForm, referral_source: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Require visa sponsorship now or in future?"
                    value={editForm.needs_visa_sponsorship || ""}
                    onChange={(e) => setEditForm({ ...editForm, needs_visa_sponsorship: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Availability to start"
                    value={editForm.availability || ""}
                    onChange={(e) => setEditForm({ ...editForm, availability: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Address Information */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600, color: "primary.main" }}>
                Address Information
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Address Line 1"
                    value={editForm.address_line1 || ""}
                    onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Address Line 2"
                    value={editForm.address_line2 || ""}
                    onChange={(e) => setEditForm({ ...editForm, address_line2: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="City"
                    value={editForm.city || ""}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="State / Province"
                    value={editForm.state || ""}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Postal Code"
                    type="number"
                    value={editForm.postal_code || ""}
                    onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EditSelectField
                    label="Country"
                    value={editForm.country}
                    onChange={(val) => setEditForm({ ...editForm, country: val })}
                    options={COUNTRY_OPTIONS}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Online Presence */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600, color: "primary.main" }}>
                Online Presence
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    type="url"
                    label="Personal Website (Optional)"
                    value={editForm.personal_website || ""}
                    onChange={(e) => setEditForm({ ...editForm, personal_website: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    type="url"
                    label="LinkedIn (Optional)"
                    value={editForm.linkedin || ""}
                    onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    type="url"
                    label="GitHub (Optional)"
                    value={editForm.github || ""}
                    onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Additional Details */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600, color: "primary.main" }}>
                Additional Details
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    label="Technical Skills"
                    value={editForm.technical_skills || ""}
                    onChange={(e) => setEditForm({ ...editForm, technical_skills: e.target.value })}
                    fullWidth
                    required
                    multiline
                    minRows={3}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Work Experience"
                    value={editForm.work_experience || ""}
                    onChange={(e) => setEditForm({ ...editForm, work_experience: e.target.value })}
                    fullWidth
                    required
                    multiline
                    minRows={3}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Education"
                    value={editForm.education || ""}
                    onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                    fullWidth
                    required
                    multiline
                    minRows={3}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Certificates"
                    value={editForm.certificates || ""}
                    onChange={(e) => setEditForm({ ...editForm, certificates: e.target.value })}
                    fullWidth
                    required
                    multiline
                    minRows={3}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setEditOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                setEditError("");
                const response = await updateMyCandidateProfile(editForm);
                setCandidate(response.candidate);
                setEditOpen(false);
                await load();
              } catch (e) {
                setEditError(e.message || "Failed to update profile");
              }
            }}
            sx={{ px: 4 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resume Details Dialog */}
      <Dialog 
        open={resumeOpen} 
        onClose={() => {
          setResumeOpen(false);
          setSelectedJob(null);
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Job Application Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedJob && (
            <Box sx={{ display: "grid", gap: 3 }}>
              {/* Job Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: 600 }}>
                  Job Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Job ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedJob.job_id}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Job Description</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>
                      {selectedJob.job_description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Applied Date</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(selectedJob.created_at).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Resume Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {selectedJob.resume_content ? (
                        <Chip label="Generated" color="success" size="small" />
                      ) : (
                        <Chip label="Pending" size="small" variant="outlined" />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Resume Content */}
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 600 }}>
                    Resume Content
                  </Typography>
                  {selectedJob.resume_content && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownloadResume(selectedJob)}
                      sx={{ fontWeight: 600 }}
                    >
                      Download Resume
                    </Button>
                  )}
                </Box>
                {selectedJob.resume_content ? (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: "grey.50",
                      maxHeight: 400,
                      overflow: "auto"
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {selectedJob.resume_content}
                    </Typography>
                  </Paper>
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
                    <Typography color="text.secondary">
                      Resume has not been generated yet for this job application.
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResumeOpen(false);
            setSelectedJob(null);
          }} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Complete Profile Details
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {candidate?.first_name} {candidate?.last_name} - Full Information
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: "grey.50" }}>
          {candidate && (
            <Box>
              {/* Personal Information */}
              <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: "white" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2, pb: 1.5, borderBottom: "2px solid", borderColor: "primary.main" }}>
                  <PersonOutline sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                    Personal Information
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        First Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.first_name}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Last Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.last_name}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, wordBreak: "break-word" }}>{candidate.email}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Phone
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.phone}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Subscription Type
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.subscription_type || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Birthdate
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {candidate.birthdate ? new Date(candidate.birthdate).toLocaleDateString() : "Not provided"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Gender
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.gender || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Address Information */}
              <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: "white" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2, pb: 1.5, borderBottom: "2px solid", borderColor: "success.main" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "success.main" }}>
                    📍 Address Information
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Address Line 1
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.address_line1 || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Address Line 2
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.address_line2 || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        City
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.city || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        State
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.state || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Postal Code
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.postal_code || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Country
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.country || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Work Information */}
              <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: "white" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2, pb: 1.5, borderBottom: "2px solid", borderColor: "info.main" }}>
                  <WorkOutlineOutlined sx={{ mr: 1, color: "info.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "info.main" }}>
                    Work Information
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Nationality
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.nationality || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Citizenship Status
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.citizenship_status || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Visa Status
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.visa_status || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Work Authorization
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.work_authorization || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Skills & Experience */}
              <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: "white" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2, pb: 1.5, borderBottom: "2px solid", borderColor: "warning.main" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "warning.main" }}>
                    🎯 Skills & Experience
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1, height: "100%" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Technical Skills
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 1, whiteSpace: "pre-wrap" }}>
                        {candidate.technical_skills || "Not provided"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1, height: "100%" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Work Experience
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 1, whiteSpace: "pre-wrap" }}>
                        {candidate.work_experience || "Not provided"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1, height: "100%" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Education
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 1, whiteSpace: "pre-wrap" }}>
                        {candidate.education || "Not provided"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1, height: "100%" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Certificates
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 1, whiteSpace: "pre-wrap" }}>
                        {candidate.certificates || "Not provided"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Additional Details */}
              <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: "white" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2, pb: 1.5, borderBottom: "2px solid", borderColor: "secondary.main" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "secondary.main" }}>
                    ℹ️ Additional Details
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Expected Wage
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.expected_wage || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Recent Degree
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{candidate.recent_degree || "Not provided"}</Typography>
                    </Box>
                  </Grid>
                  {[
                    { label: "Willing to Relocate", value: candidate.willing_relocate },
                    { label: "Willing to Travel", value: candidate.willing_travel },
                    { label: "Veteran Status", value: candidate.veteran_status },
                    { label: "Military Experience", value: candidate.military_experience },
                    { label: "Race/Ethnicity", value: candidate.race_ethnicity },
                    { label: "Disability Status", value: candidate.disability_status },
                    { label: "At Least 18 Years Old", value: candidate.at_least_18 },
                    { label: "Authorized to Work in US", value: candidate.authorized_work_us },
                    { label: "Authorized Without Sponsorship", value: candidate.authorized_without_sponsorship },
                    { label: "Needs Visa Sponsorship", value: candidate.needs_visa_sponsorship },
                    { label: "Contact Current Employer", value: candidate.contact_current_employer },
                    { label: "Availability to Start", value: candidate.availability },
                    { label: "Family Member in Organization", value: candidate.family_in_org, fullWidth: true },
                    { label: "Referral Source", value: candidate.referral_source, fullWidth: true }
                  ].map((field, index) => (
                    <Grid item xs={12} sm={field.fullWidth ? 12 : 6} md={field.fullWidth ? 12 : 4} key={index}>
                      <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {field.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{field.value || "Not provided"}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* Online Presence */}
              {(candidate.personal_website || candidate.linkedin || candidate.github) && (
                <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: "white" }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2, pb: 1.5, borderBottom: "2px solid", borderColor: "info.main" }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "info.main" }}>
                      🌐 Online Presence
                    </Typography>
                  </Box>
                  <Grid container spacing={3}>
                    {candidate.personal_website && (
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Personal Website
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                            <a href={candidate.personal_website} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", textDecoration: "none" }}>
                              {candidate.personal_website}
                            </a>
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {candidate.linkedin && (
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            LinkedIn
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                            <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", textDecoration: "none" }}>
                              {candidate.linkedin}
                            </a>
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {candidate.github && (
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            GitHub
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                            <a href={candidate.github} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", textDecoration: "none" }}>
                              {candidate.github}
                            </a>
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setDetailsOpen(false)} variant="contained" sx={{ px: 4 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

