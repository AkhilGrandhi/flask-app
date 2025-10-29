// src/pages/CandidateDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Container, Box, Paper, Typography, Stack, Divider,
  TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Alert, Chip, Grid, Tooltip
} from "@mui/material";
import { ArrowBack, Person, Email, Phone, Work, Add, Download } from "@mui/icons-material";
import { getCandidate, addCandidateJob, updateCandidateJob, deleteCandidateJob, generateResume, generateResumeAsync, getJobStatus, downloadResumeAsync } from "../api";
import { fullName } from "../utils/display";

export default function CandidateDetail() {
  const { id } = useParams();
  const [cand, setCand] = useState(null);
  const [jobId, setJobId] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [err, setErr] = useState("");
  const [generating, setGenerating] = useState(false);
  const [jobProgress, setJobProgress] = useState({});  // Track progress for each job
  const [useAsync, setUseAsync] = useState(false);  // Toggle between async and sync (default: sync for reliability)
  
  // Filter states for job applications
  const [dateFilter, setDateFilter] = useState("");  // Filter by date
  const [jobIdFilter, setJobIdFilter] = useState("");  // Filter by job ID
  const [jobDescFilter, setJobDescFilter] = useState("");  // Filter by job description
  
  // View dialog state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewJob, setViewJob] = useState(null);
  
  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [editJobId, setEditJobId] = useState("");
  const [editJobDesc, setEditJobDesc] = useState("");

  const load = async () => {
    try {
      const d = await getCandidate(id);
      setCand(d);
    } catch (e) {
      console.error("Error loading candidate:", e);
      setErr("Failed to load candidate: " + e.message);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Format candidate data for resume generation
  const formatCandidateInfo = (candidate) => {
    let info = `Name: ${candidate.first_name} ${candidate.last_name}\n`;
    info += `Email: ${candidate.email || 'N/A'}\n`;
    info += `Phone: ${candidate.phone || 'N/A'}\n`;
    if (candidate.city || candidate.state || candidate.country) {
      info += `Location: ${[candidate.city, candidate.state, candidate.country].filter(Boolean).join(', ')}\n`;
    }
    info += `\n`;
    
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

  // Poll job status until complete
  const pollJobStatus = async (jobTaskId, jobRowId) => {
    const maxAttempts = 60;  // 60 attempts * 2s = 2 minutes max
    let attempts = 0;
    
    const poll = async () => {
      try {
        const statusData = await getJobStatus(jobTaskId);
        
        // Update progress in UI
        setJobProgress(prev => ({
          ...prev,
          [jobRowId]: {
            status: statusData.status,
            progress: statusData.progress,
            error: statusData.error_message
          }
        }));
        
        if (statusData.status === 'SUCCESS') {
          // Download the resume automatically
          const blob = await downloadResumeAsync(jobTaskId);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${cand.first_name}_${cand.last_name}_Resume.docx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          // Clean up progress indicator
          setTimeout(() => {
            setJobProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[jobRowId];
              return newProgress;
            });
          }, 3000);
          
          await load();  // Reload candidate data
          return true;
        } else if (statusData.status === 'FAILURE') {
          setErr(statusData.error_message || 'Resume generation failed');
          return true;
        } else if (statusData.status === 'PROCESSING' || statusData.status === 'PENDING') {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(() => poll(), 2000);  // Poll every 2 seconds
          } else {
            setErr('Resume generation timed out');
            return true;
          }
        }
      } catch (e) {
        console.error('Error polling job status:', e);
        setErr('Error checking resume status: ' + e.message);
        return true;
      }
    };
    
    poll();
  };

  const addJob = async () => {
    let jobRowId = null;
    try {
      setErr("");
      setGenerating(true);
      
      if (useAsync) {
        // ASYNC MODE: Start background job and return immediately
        const response = await generateResumeAsync({
          candidate_id: parseInt(id),
          job_id: jobId,
          job_description: jobDesc,
          file_type: "word"
        });
        
        jobRowId = response.job_row_id;
        
        // Set initial progress
        setJobProgress(prev => ({
          ...prev,
          [jobRowId]: {
            status: 'PENDING',
            progress: 0
          }
        }));
        
        // Start polling for status
        pollJobStatus(response.job_id, jobRowId);
        
        setJobId(""); 
        setJobDesc("");
        setGenerating(false);
        await load();
        
      } else {
        // SYNC MODE: Wait for generation to complete (may take 30-60 seconds)
        const response = await addCandidateJob(id, { job_id: jobId, job_description: jobDesc });
        jobRowId = response.id;
        
        const candidateInfo = formatCandidateInfo(cand);
        const blob = await generateResume(jobDesc, candidateInfo, "word", id, jobRowId);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cand.first_name}_${cand.last_name}_Resume.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setJobId(""); 
        setJobDesc("");
        await load();
      }
    } catch (e) { 
      setErr(e.message);
      
      // If resume generation failed after creating job, delete the job record
      if (jobRowId && !useAsync) {
        try {
          await deleteCandidateJob(id, jobRowId);
          console.log("Cleaned up job record after resume generation failure");
        } catch (cleanupError) {
          console.error("Failed to cleanup job record:", cleanupError);
        }
      }
    } finally {
      if (!useAsync) {
        setGenerating(false);
      }
    }
  };

  const removeJob = async (rowId) => {
    try {
      await deleteCandidateJob(id, rowId);
      await load();
    } catch (e) {
      console.error("Error deleting job:", e);
      setErr("Failed to delete job: " + e.message);
    }
  };

  const handleViewJob = (job) => {
    setViewJob(job);
    setViewOpen(true);
  };

  const handleEditJob = (job) => {
    setEditJob(job);
    setEditJobId(job.job_id);
    setEditJobDesc(job.job_description);
    setEditOpen(true);
  };

  const handleUpdateJob = async () => {
    try {
      setErr("");
      await updateCandidateJob(id, editJob.id, { 
        job_id: editJobId, 
        job_description: editJobDesc 
      });
      setEditOpen(false);
      setEditJob(null);
      setEditJobId("");
      setEditJobDesc("");
      await load();
    } catch (e) {
      console.error("Error updating job:", e);
      setErr("Failed to update job: " + e.message);
    }
  };

  const handleDownloadResume = (job) => {
    if (!job.resume_content) {
      setErr("No resume content available to download");
      return;
    }

    try {
      // Create a Blob with the resume content in a format that Word can open
      const content = `${cand.first_name} ${cand.last_name} - Resume
Job ID: ${job.job_id}
Generated: ${new Date(job.created_at).toLocaleDateString()}

${job.resume_content}`;

      const blob = new Blob([content], { type: 'application/msword' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cand.first_name}_${cand.last_name}_Resume_${job.job_id}.doc`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Error downloading resume:", e);
      setErr("Failed to download resume: " + e.message);
    }
  };

  // Show error if loading failed
  if (err && !cand) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error Loading Candidate
          </Typography>
          <Typography color="error" sx={{ mb: 2 }}>
            {err}
          </Typography>
          <Button component={RouterLink} to="/" variant="contained">
            ← Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  // Show loading state
  if (!cand) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
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
              Candidate Job Applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage Job Applications and Generate Resumes
            </Typography>
          </Box>
        </Box>
        <Button 
          component={RouterLink} 
          to="/" 
          variant="outlined"
          startIcon={<ArrowBack />}
          sx={{ fontWeight: 600 }}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Candidate Info Card */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden", mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "primary.main", mr: 1.5, width: 40, height: 40 }}>
                  <Person sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Full Name
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {fullName({ first_name: cand.first_name, last_name: cand.last_name })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "success.main", mr: 1.5, width: 40, height: 40 }}>
                  <Email sx={{ fontSize: 20 }} />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Email Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.9rem", wordBreak: "break-word" }}>
                    {cand.email || "-"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "warning.main", mr: 1.5, width: 40, height: 40 }}>
                  <Phone sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Phone Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {cand.phone || "-"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "info.main", mr: 1.5, width: 40, height: 40 }}>
                  <Work sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    SSN Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {cand.ssn || "-"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Add Job Section */}
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden", mb: 2, border: "2px solid", borderColor: "primary.main" }}>
        <Box sx={{ 
          px: 2.5,
          py: 1.25, 
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem" }}>
            🚀 Generate Resume
          </Typography>
          <Button 
            variant="contained" 
            size="small"
            onClick={addJob} 
            disabled={generating || !jobId || !jobDesc}
            startIcon={generating ? <CircularProgress size={14} color="inherit" /> : <Add />}
            sx={{ 
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              bgcolor: "white",
              color: "primary.main",
              px: 2,
              py: 0.75,
              borderRadius: 1.5,
              boxShadow: 1,
              "&:hover": {
                bgcolor: "grey.100",
                boxShadow: 2
              },
              "&:disabled": {
                bgcolor: "grey.300",
                color: "grey.600"
              }
            }}
          >
            {generating ? "Generating..." : "Generate"}
          </Button>
        </Box>
        <Box sx={{ p: 2.5 }}>
          {err && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {err}
            </Alert>
          )}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box sx={{ width: "30%" }}>
              <TextField
                label="Job ID"
                value={jobId}
                onChange={(e)=>setJobId(e.target.value)}
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
                onChange={(e)=>setJobDesc(e.target.value)}
                fullWidth
                multiline
                rows={2}
                disabled={generating}
                required
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Jobs Table */}
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden", border: "2px solid", borderColor: "success.main" }}>
        <Box sx={{ 
          px: 2.5,
          py: 1.25, 
          bgcolor: "success.main",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem" }}>
            📋 Job Applications
          </Typography>
          
          {/* Filters */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <TextField
              type="date"
              size="small"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Date"
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
            
            {(dateFilter || jobIdFilter || jobDescFilter) && (
              <Button 
                size="small" 
                variant="contained"
                onClick={() => {
                  setDateFilter("");
                  setJobIdFilter("");
                  setJobDescFilter("");
                }}
                sx={{ 
                  height: 32,
                  bgcolor: "white",
                  color: "success.main",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.9)"
                  }
                }}
              >
                Clear All
              </Button>
            )}
            
            <Chip 
              label={`${(() => {
                const filteredJobs = (cand.jobs || []).filter(j => {
                  if (dateFilter) {
                    const jobDate = new Date(j.created_at).toISOString().split('T')[0];
                    if (jobDate !== dateFilter) return false;
                  }
                  if (jobIdFilter && !j.job_id.toLowerCase().includes(jobIdFilter.toLowerCase())) {
                    return false;
                  }
                  if (jobDescFilter && !j.job_description.toLowerCase().includes(jobDescFilter.toLowerCase())) {
                    return false;
                  }
                  return true;
                });
                return filteredJobs.length;
              })()} Application${(() => {
                const filteredJobs = (cand.jobs || []).filter(j => {
                  if (dateFilter) {
                    const jobDate = new Date(j.created_at).toISOString().split('T')[0];
                    if (jobDate !== dateFilter) return false;
                  }
                  if (jobIdFilter && !j.job_id.toLowerCase().includes(jobIdFilter.toLowerCase())) {
                    return false;
                  }
                  if (jobDescFilter && !j.job_description.toLowerCase().includes(jobDescFilter.toLowerCase())) {
                    return false;
                  }
                  return true;
                });
                return filteredJobs.length;
              })() !== 1 ? 's' : ''}`}
              sx={{ 
                fontWeight: 600,
                bgcolor: "white",
                color: "success.main",
                fontSize: "0.75rem",
                height: 24
              }}
            />
          </Box>
        </Box>
        
        {(() => {
          const filteredJobs = (cand.jobs || []).filter(j => {
            if (dateFilter) {
              const jobDate = new Date(j.created_at).toISOString().split('T')[0];
              if (jobDate !== dateFilter) return false;
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
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Job ID</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Job Description</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Resume Status</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Created</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, py: 1.25 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredJobs.map(j => (
                <TableRow 
                  key={j.id}
                  hover
                  sx={{ 
                    "&:hover": { bgcolor: "primary.lighter" },
                    "& td": { py: 1.5 }
                  }}
                >
                  <TableCell sx={{ whiteSpace:"nowrap", fontWeight: 600, color: "primary.main" }}>
                    <Tooltip title={j.job_id} arrow placement="top">
                      <span>
                        {j.job_id.length > 15 ? j.job_id.substring(0, 15) + '...' : j.job_id}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 400 }}>
                    <Typography variant="body2">
                      {j.job_description.length > 80 
                        ? j.job_description.substring(0, 80) + '...' 
                        : j.job_description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {jobProgress[j.id] ? (
                        // Show progress indicator for jobs being generated
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={20} variant="determinate" value={jobProgress[j.id].progress} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {jobProgress[j.id].status === 'PROCESSING' ? 
                              `Generating... ${jobProgress[j.id].progress}%` : 
                              'Queued...'}
                          </Typography>
                        </Box>
                      ) : j.resume_content ? (
                        // Job completed
                        <>
                          <Chip label="Generated" color="success" size="small" sx={{ fontWeight: 600 }} />
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<Download />}
                            onClick={() => handleDownloadResume(j)}
                            sx={{ 
                              textTransform: "none", 
                              fontWeight: 500,
                              minWidth: "auto",
                              px: 1
                            }}
                          >
                            Download
                          </Button>
                        </>
                      ) : (
                        // Job created but no resume yet
                        <Chip label="Pending" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ whiteSpace:"nowrap", color: "text.secondary" }}>
                    {new Date(j.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={()=>handleViewJob(j)}
                        sx={{ textTransform: "none", fontWeight: 500 }}
                      >
                        View
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained"
                        onClick={()=>handleEditJob(j)}
                        sx={{ textTransform: "none", fontWeight: 500 }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined"
                        color="error" 
                        onClick={()=>removeJob(j.id)}
                        sx={{ textTransform: "none", fontWeight: 500 }}
                      >
                        Delete
                      </Button>
                    </Stack>
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
              <Work sx={{ fontSize: 40, color: "primary.main" }} />
            </Avatar>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {(dateFilter || jobIdFilter || jobDescFilter) ? "No Applications Match Filters" : "No Job Applications Yet"}
            </Typography>
            <Typography color="text.secondary">
              {(dateFilter || jobIdFilter || jobDescFilter)
                ? "No job applications match your filter criteria. Try adjusting or clearing the filters."
                : "Add a job application above to generate a tailored resume"}
            </Typography>
          </Box>
        );
        })()}
      </Paper>

      {/* View Job Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Job Application Details
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            View complete job information and generated resume
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: "grey.50" }}>
          {viewJob && (
            <Box sx={{ display: "grid", gap: 3 }}>
              {/* Job Information */}
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: "white" }}>
                <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600, color: "primary.main" }}>
                  Job Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Job ID
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{viewJob.job_id}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {viewJob.resume_content ? (
                          <Chip label="Resume Generated" color="success" size="small" sx={{ fontWeight: 600 }} />
                        ) : (
                          <Chip label="Pending" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                        )}
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Created At
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {new Date(viewJob.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5, mb: 1, display: "block" }}>
                        Job Description
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {viewJob.job_description}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Resume Content */}
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "success.main" }}>
                    Generated Resume Content
                  </Typography>
                  {viewJob.resume_content && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownloadResume(viewJob)}
                      sx={{ fontWeight: 600 }}
                    >
                      Download Resume
                    </Button>
                  )}
                </Box>
                {viewJob.resume_content ? (
                  <Paper 
                    variant="outlined"
                    sx={{ 
                      p: 2.5, 
                      backgroundColor: 'grey.50', 
                      maxHeight: '500px', 
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {viewJob.resume_content}
                    </Typography>
                  </Paper>
                ) : (
                  <Alert severity="info">
                    <Typography variant="body2">
                      No resume content available. Resume content is generated when you click "Generate Resume".
                    </Typography>
                  </Alert>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setViewOpen(false)} variant="contained" sx={{ px: 4 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Edit Job Application
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Update job ID and description
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: "grey.50" }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: "white" }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  label="Job ID"
                  value={editJobId}
                  onChange={(e) => setEditJobId(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Job Description"
                  value={editJobDesc}
                  onChange={(e) => setEditJobDesc(e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={6}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setEditOpen(false)} variant="outlined">Cancel</Button>
          <Button 
            onClick={handleUpdateJob} 
            variant="contained" 
            disabled={!editJobId || !editJobDesc}
            sx={{ px: 4 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
