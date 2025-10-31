import { useEffect, useState, useId } from "react";
import {
  Container, Box, Typography, Paper, Table, TableHead,
  TableRow, TableCell, TableBody, Button, Avatar, Stack, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Divider, TextField, Alert,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Snackbar, Menu, IconButton, Tooltip
} from "@mui/material";
import {
  PersonOutline, PhoneOutlined,
  WorkOutlineOutlined, VisibilityOutlined, Download, WorkspacePremium, Add
} from "@mui/icons-material";
import { useAuth } from "../AuthContext";
import { getMyCandidateProfile, updateMyCandidateProfile, addCandidateJob, generateResume, deleteCandidateJob } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  OTHER, GENDER_OPTIONS, CITIZENSHIP_OPTIONS, VISA_OPTIONS,
  WORK_AUTH_OPTIONS, VETERAN_OPTIONS, RACE_ETHNICITY_OPTIONS,
  COUNTRY_OPTIONS
} from "../constants/options";

const RESUME_DAILY_LIMIT = 50;
const DAILY_LIMIT_MESSAGE = "Your daily resume limit has been exceeded. Please try again tomorrow.";

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
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  
  // Generate Resume state (for Silver subscribers)
  const [jobId, setJobId] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [resumeCountToday, setResumeCountToday] = useState(0);
  
  // Filter states for job applications
  const [jobDateFilter, setJobDateFilter] = useState("");
  const [jobIdFilter, setJobIdFilter] = useState("");
  const [jobDescFilter, setJobDescFilter] = useState("");
  
  // Profile menu state
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const profileMenuOpen = Boolean(profileMenuAnchor);

  const limitReached = resumeCountToday >= RESUME_DAILY_LIMIT;
  const remainingResumes = Math.max(0, RESUME_DAILY_LIMIT - resumeCountToday);
  const limitMessage = limitReached
    ? DAILY_LIMIT_MESSAGE
    : `You can generate ${remainingResumes} more resume${remainingResumes === 1 ? '' : 's'} today (limit ${RESUME_DAILY_LIMIT}).`;

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyCandidateProfile();
      setCandidate(data);

      const today = new Date();
      const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
      const generatedToday = jobs.filter((job) => {
        if (!job?.resume_content || !job?.created_at) return false;
        const createdAt = new Date(job.created_at);
        return (
          createdAt.getFullYear() === today.getFullYear() &&
          createdAt.getMonth() === today.getMonth() &&
          createdAt.getDate() === today.getDate()
        );
      }).length;

      setResumeCountToday(generatedToday);
    } catch (e) {
      setError(e.message);
      setResumeCountToday(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownloadResume = (job) => {
    if (!job.resume_content) {
      setToast({ 
        open: true, 
        message: '⚠️ No resume content available to download', 
        severity: 'warning' 
      });
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
      
      setToast({ 
        open: true, 
        message: '✓ Resume downloaded successfully!', 
        severity: 'success' 
      });
    } catch (e) {
      console.error("Error downloading resume:", e);
      setToast({ 
        open: true, 
        message: `✗ Failed to download resume: ${e.message}`, 
        severity: 'error' 
      });
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
    if (limitReached) {
      setGenerateError("");
      setToast({ 
        open: true, 
        message: `⚠️ ${DAILY_LIMIT_MESSAGE}`, 
        severity: 'warning' 
      });
      return;
    }

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
      setToast({ 
        open: true, 
        message: '✓ Resume generated and downloaded successfully!', 
        severity: 'success' 
      });
      setResumeCountToday((count) => Math.min(RESUME_DAILY_LIMIT, count + 1));
      await load();
    } catch (e) { 
      const messageText = e?.message || "Unknown error";
      if (messageText.toLowerCase().includes("daily resume limit")) {
        setGenerateError("");
      setToast({ 
        open: true, 
          message: `⚠️ ${DAILY_LIMIT_MESSAGE}`, 
          severity: 'warning' 
        });
      } else {
        setGenerateError(messageText);
        setToast({ 
          open: true, 
          message: `✗ Failed to generate resume: ${messageText}`, 
        severity: 'error' 
      });
      }
      
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
    return <LoadingSpinner message="Loading your profile..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      {/* Compact Header */}
      <Box sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: 1100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        flexShrink: 0
      }}>
        <Container maxWidth="lg">
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
            py: 1
      }}>
            {/* Logo and Brand */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <img 
            src="/only_logo.png" 
            alt="Data Fyre Logo" 
                style={{ height: "36px", width: "auto", objectFit: "contain" }}
          />
          <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.1, fontSize: '1.1rem' }}>
                  Data Fyre
            </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Candidate Portal
            </Typography>
          </Box>
        </Box>

            {/* User Menu */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip 
                label={candidate?.subscription_type === "Gold" ? "🥇 Gold" : "🥈 Silver"} 
                sx={{ 
                  bgcolor: candidate?.subscription_type === "Gold" ? "#FFD700" : "#C0C0C0",
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24
                }}
                size="small"
              />
              <Box sx={{ textAlign: "right", display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}>
              {candidate?.first_name} {candidate?.last_name}
            </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {candidate?.email}
                </Typography>
          </Box>
              <Avatar 
                onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
                sx={{ 
                  width: 32, 
                  height: 32, 
            bgcolor: "primary.main", 
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
            {candidate?.first_name?.[0]}{candidate?.last_name?.[0]}
          </Avatar>
              <Menu
                anchorEl={profileMenuAnchor}
                open={profileMenuOpen}
                onClose={() => setProfileMenuAnchor(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                sx={{ mt: 1 }}
              >
                <MenuItem 
                  onClick={() => {
                    setDetailsOpen(true);
                    setProfileMenuAnchor(null);
                  }}
                  sx={{ gap: 1, py: 1, px: 2, minWidth: 160 }}
                >
                  <VisibilityOutlined sx={{ fontSize: 18 }} />
                  <Typography variant="body2">View Profile</Typography>
                </MenuItem>
                <MenuItem 
              onClick={() => {
                setEditForm(candidate);
                setEditError("");
                setEditOpen(true);
                    setProfileMenuAnchor(null);
                  }}
                  sx={{ gap: 1, py: 1, px: 2 }}
                >
                  <PersonOutline sx={{ fontSize: 18 }} />
                  <Typography variant="body2">Edit Profile</Typography>
                </MenuItem>
              </Menu>
              <Button 
                onClick={logout} 
                variant="outlined" 
                size="small"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600, 
                  py: 0.5,
                  px: 1.5,
                  fontSize: '0.8rem'
                }}
              >
                Logout
              </Button>
            </Stack>
            </Box>
        </Container>
          </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 1, md: 1.25 }, display: 'flex', flexDirection: 'column', minHeight: 0, gap: 1.5, overflow: 'hidden' }}>
      {/* Generate Resume Section - Only for Silver Subscribers */}
      {candidate?.subscription_type === "Silver" && (
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden", mb: 2, border: "1px solid", borderColor: "divider", flexShrink: 0 }}>
          <Box sx={{ 
            px: 2,
            py: 0.75, 
            bgcolor: "success.main",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: { xs: "wrap", sm: "nowrap" }
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
              🚀 Generate Resume
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Typography 
                variant="body2" 
                sx={{ fontWeight: 500, fontSize: "0.8rem", opacity: 0.95, textAlign: "right" }}
              >
                {limitMessage}
            </Typography>
            <Button 
              variant="contained" 
              size="small"
              onClick={handleGenerateResume} 
                disabled={generating || !jobId || !jobDesc || limitReached}
              startIcon={generating ? <CircularProgress size={12} color="inherit" /> : <Add />}
              sx={{ 
                fontWeight: 600,
                fontSize: "0.75rem",
                textTransform: "none",
                bgcolor: "white",
                color: "success.main",
                px: 1.5,
                height: 32,
                "&:hover": { 
                  bgcolor: "rgba(255,255,255,0.9)"
                },
                "&.Mui-disabled": {
                  bgcolor: "rgba(255,255,255,0.6)",
                  color: "rgba(0,0,0,0.4)"
                }
              }}
            >
              {generating ? "Generating..." : "Generate"}
            </Button>
            </Box>
          </Box>
          
          <Box sx={{ p: 1.25 }}>
            {generateError && (
              <Alert severity="error" sx={{ mb: 1.25 }} onClose={() => setGenerateError("")}>
                {generateError}
              </Alert>
            )}
            
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                alignItems: "stretch",
                flexDirection: { xs: "column", sm: "row" }
              }}
            >
              <TextField
                label="Job ID"
                placeholder="Enter or paste the Job ID"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                disabled={generating || limitReached}
                required
                variant="outlined"
                size="small"
                fullWidth
                multiline
                minRows={3}
                maxRows={3}
                inputProps={{ style: { overflowY: 'auto' } }}
              />
              <TextField
                label="Job Description"
                placeholder="Paste the Job Description"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                disabled={generating || limitReached}
                required
                variant="outlined"
                size="small"
                fullWidth
                multiline
                minRows={3}
                maxRows={3}
                inputProps={{ style: { overflowY: 'auto' } }}
              />
            </Box>
          </Box>
        </Paper>
      )}

      {/* Jobs Applied Section - Compact */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden", border: '1px solid', borderColor: 'divider', flexShrink: 1, display: 'flex', flexDirection: 'column', minHeight: { xs: 'auto', md: 420 } }}>
        <Box sx={{ 
          px: 2,
          py: 0.75, 
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexShrink: 0
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
              💼 Jobs Applied
          </Typography>
          
          {/* Filters */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, justifyContent: "flex-end" }}>
            <TextField
              type="date"
              size="small"
              value={jobDateFilter}
              onChange={(e) => setJobDateFilter(e.target.value)}
              placeholder="Date"
              autoComplete="off"
              InputLabelProps={{ shrink: true }}
              sx={{
                bgcolor: "white",
                borderRadius: 1,
                width: 140,
                "& .MuiOutlinedInput-root": {
                  height: 32,
                  fontSize: "0.8rem"
                }
              }}
            />
            
            <TextField
              size="small"
              value={jobIdFilter}
              onChange={(e) => setJobIdFilter(e.target.value)}
              placeholder="Job ID"
              autoComplete="off"
              sx={{
                bgcolor: "white",
                borderRadius: 1,
                width: 120,
                "& .MuiOutlinedInput-root": {
                  height: 32,
                  fontSize: "0.8rem"
                }
              }}
            />
            
            <TextField
              size="small"
              value={jobDescFilter}
              onChange={(e) => setJobDescFilter(e.target.value)}
              placeholder="Description"
              autoComplete="off"
              sx={{
                bgcolor: "white",
                borderRadius: 1,
                width: 140,
                "& .MuiOutlinedInput-root": {
                  height: 32,
                  fontSize: "0.8rem"
                }
              }}
            />
            
            {(jobDateFilter || jobIdFilter || jobDescFilter) && (
              <Button 
                size="small" 
                variant="contained"
                onClick={() => {
                  setJobDateFilter("");
                  setJobIdFilter("");
                  setJobDescFilter("");
                }}
                sx={{ 
                  height: 32,
                  bgcolor: "white",
                  color: "primary.main",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  minWidth: "auto",
                  px: 1.5,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.9)"
                  }
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>

        {(() => {
          const filteredJobs = (candidate?.jobs || []).filter(j => {
            if (jobDateFilter) {
              const jobDate = new Date(j.created_at).toISOString().split('T')[0];
              if (jobDate !== jobDateFilter) return false;
            }
            if (jobIdFilter && !j.job_id.toLowerCase().includes(jobIdFilter.toLowerCase())) {
              return false;
            }
            if (jobDescFilter && !j.job_description.toLowerCase().includes(jobDescFilter.toLowerCase())) {
              return false;
            }
            return true;
          });
          return filteredJobs.length > 0 ? (
          <Box sx={{ flex: 1, overflowX: 'auto', overflowY: 'auto', maxHeight: { xs: 'unset', md: 440 } }}>
          <Table size="small" stickyHeader sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>Job ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>Job Description</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>Resume Content</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>Applied Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: "text.primary", py: 1, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow 
                  key={job.id} 
                  hover
                  sx={{ 
                    "&:hover": { 
                      bgcolor: "primary.lighter",
                      cursor: "pointer"
                    },
                    transition: "all 0.2s",
                    "& td": { py: 0.75 }
                  }}
                >
                  <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 500 }}>
                    <Tooltip title={job.job_id} arrow placement="top">
                      <span style={{ color: '#1976d2', fontWeight: 600 }}>
                        {job.job_id.length > 15 ? job.job_id.substring(0, 15) + '...' : job.job_id}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 350 }}>
                    <Typography variant="body2">
                      {job.job_description.length > 100
                        ? job.job_description.substring(0, 100) + "..."
                        : job.job_description}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      {job.resume_content ? (
                        <Typography variant="body2" color="text.secondary">
                          {job.resume_content.length > 80
                            ? job.resume_content.substring(0, 80) + "..."
                            : job.resume_content}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          Not generated
                        </Typography>
                      )}
                      {job.resume_content && (
                        <Tooltip title="Download Resume" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadResume(job)}
                            sx={{ 
                              color: 'primary.main',
                              p: 0.5,
                              '&:hover': {
                                bgcolor: 'primary.lighter'
                              }
                            }}
                          >
                            <Download sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {job.resume_content ? (
                      <Chip label="Generated" color="success" size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                    ) : (
                      <Chip label="Pending" size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                    {new Date(job.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                      size="small"
                        color="primary"
                      onClick={() => {
                        setSelectedJob(job);
                        setResumeOpen(true);
                      }}
                    >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </Box>
        ) : (
          <Box sx={{ 
            textAlign: "center", 
            py: 6,
            px: 2
          }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: "auto", 
              mb: 2,
              bgcolor: "primary.lighter"
            }}>
              <Typography variant="h3">💼</Typography>
            </Avatar>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {(jobDateFilter || jobIdFilter || jobDescFilter) ? "No Matching Applications" : "No Jobs Applied Yet"}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {(jobDateFilter || jobIdFilter || jobDescFilter)
                ? "Try adjusting your filters"
                : "You haven't applied to any jobs yet. Check back later!"}
            </Typography>
          </Box>
        );
        })()}
      </Paper>

      {/* Edit Details Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Edit Profile Details
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Update your personal information
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3.5, bgcolor: "#fafafa" }}>
          {editError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {editError}
            </Alert>
          )}
          <Box sx={{ display: "grid", gap: 3.5 }}>
            {/* Personal Information */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, background: "linear-gradient(to bottom, #ffffff 0%, #f0f7ff 100%)" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5, pb: 1.5, borderBottom: "2px solid", borderColor: "primary.main" }}>
                <PersonOutline sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                  Personal Information
                </Typography>
              </Box>
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
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, background: "linear-gradient(to bottom, #ffffff 0%, #f0fdf4 100%)" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5, pb: 1.5, borderBottom: "2px solid", borderColor: "success.main" }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "success.main" }}>
                  📍 Address Information
                </Typography>
              </Box>
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
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, background: "linear-gradient(to bottom, #ffffff 0%, #eff6ff 100%)" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5, pb: 1.5, borderBottom: "2px solid", borderColor: "info.main" }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "info.main" }}>
                  🌐 Online Presence
                </Typography>
              </Box>
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

            {/* Skills & Experience */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, background: "linear-gradient(to bottom, #ffffff 0%, #fef9f5 100%)" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5, pb: 1.5, borderBottom: "2px solid #ed6c02" }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "warning.main" }}>
                  🎯 Skills & Experience
                </Typography>
              </Box>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    label="Technical Skills"
                    value={editForm.technical_skills || ""}
                    onChange={(e) => setEditForm({ ...editForm, technical_skills: e.target.value })}
                    fullWidth
                    required
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="e.g., JavaScript, Python, React, Node.js..."
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
                    rows={4}
                    variant="outlined"
                    placeholder="Describe your work experience..."
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
                    rows={4}
                    variant="outlined"
                    placeholder="Your educational background..."
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
                    rows={4}
                    variant="outlined"
                    placeholder="List your certifications..."
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setEditOpen(false)} variant="outlined" disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                setSubmitting(true);
                setEditError("");
                
                // Clean the data before sending - remove fields that shouldn't be updated
                const cleanedData = { ...editForm };
                delete cleanedData.id;
                delete cleanedData.jobs;
                delete cleanedData.created_by_user_id;
                delete cleanedData.created_at;
                
                console.log("Sending data:", cleanedData);
                const response = await updateMyCandidateProfile(cleanedData);
                console.log("Response:", response);
                
                setCandidate(response.candidate);
                setEditOpen(false);
                setToast({ 
                  open: true, 
                  message: '✓ Profile updated successfully!', 
                  severity: 'success' 
                });
                await load();
              } catch (e) {
                console.error("Update error:", e);
                setEditError(e.message || "Failed to update profile");
                setToast({ 
                  open: true, 
                  message: `✗ Failed to update profile: ${e.message}`, 
                  severity: 'error' 
                });
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ px: 4 }}
          >
            {submitting ? "Saving..." : "Save Changes"}
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
                  <Grid item xs={12}>
                    <Box sx={{ p: 2.5, bgcolor: "grey.50", borderRadius: 1.5, border: "1px solid", borderColor: "grey.300" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
                        Technical Skills
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 1.5, whiteSpace: "pre-wrap", lineHeight: 1.7, color: "text.primary" }}>
                        {candidate.technical_skills || "Not provided"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ p: 2.5, bgcolor: "grey.50", borderRadius: 1.5, border: "1px solid", borderColor: "grey.300" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
                        Work Experience
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 1.5, whiteSpace: "pre-wrap", lineHeight: 1.7, color: "text.primary" }}>
                        {candidate.work_experience || "Not provided"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ p: 2.5, bgcolor: "grey.50", borderRadius: 1.5, border: "1px solid", borderColor: "grey.300" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
                        Education
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 1.5, whiteSpace: "pre-wrap", lineHeight: 1.7, color: "text.primary" }}>
                        {candidate.education || "Not provided"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ p: 2.5, bgcolor: "grey.50", borderRadius: 1.5, border: "1px solid", borderColor: "grey.300" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
                        Certificates
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 1.5, whiteSpace: "pre-wrap", lineHeight: 1.7, color: "text.primary" }}>
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
                <Grid container spacing={3}>
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

      {/* Enhanced Footer */}
      <Box 
        component="footer" 
        sx={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderTop: '1px solid rgba(148, 163, 184, 0.25)',
          color: 'rgba(226,232,240,0.9)',
          py: 1.75,
          mt: 'auto',
          flexShrink: 0,
          boxShadow: '0 -6px 18px rgba(15, 23, 42, 0.25)'
        }}
      >
        <Container maxWidth="lg">
          <Stack 
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 1, md: 3 }}
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: '100%' }}
          >
            {/* Left: Logo & Copyright */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.08)', 
                p: 0.75, 
                borderRadius: 1.5, 
                display: 'flex', 
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(15,23,42,0.35)'
              }}>
                <img 
                  src="/only_logo.png" 
                  alt="Data Fyre" 
                  style={{ height: "22px", width: "auto" }}
                />
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  letterSpacing: 0.3
                }}
              >
                © {new Date().getFullYear()} Data Fyre. All rights reserved.
              </Typography>
            </Stack>

            {/* Center: Links */}
            <Stack 
              direction="row" 
              spacing={2.5} 
              alignItems="center"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem', 
                  cursor: 'pointer',
                  color: 'rgba(226,232,240,0.9)',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    color: 'white'
                  } 
                }}
              >
                About
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem', 
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    textDecoration: 'underline'
                  } 
                }}
              >
                Privacy
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem', 
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    textDecoration: 'underline'
                  } 
                }}
              >
                Terms
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem', 
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    textDecoration: 'underline'
                  } 
                }}
              >
                Help
              </Typography>
            </Stack>

            {/* Right: Contact */}
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ 
                bgcolor: 'rgba(148,163,184,0.18)', 
                p: 0.85, 
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    letterSpacing: 0.2
                  }}
                >
                  📧 support@datafyre.com
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Toast Notification */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setToast({ ...toast, open: false })} 
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

