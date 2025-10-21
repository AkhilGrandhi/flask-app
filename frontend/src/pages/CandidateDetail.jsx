// src/pages/CandidateDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Container, Box, Paper, Typography, Stack, Divider,
  TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { getCandidate, addCandidateJob, updateCandidateJob, deleteCandidateJob, generateResume } from "../api";
import { fullName } from "../utils/display";

export default function CandidateDetail() {
  const { id } = useParams();
  const [cand, setCand] = useState(null);
  const [jobId, setJobId] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [err, setErr] = useState("");
  const [generating, setGenerating] = useState(false);
  
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

  const addJob = async () => {
    try {
      setErr("");
      setGenerating(true);
      
      // Add job first
      await addCandidateJob(id, { job_id: jobId, job_description: jobDesc });
      
      // Generate and download resume
      const candidateInfo = formatCandidateInfo(cand);
      const blob = await generateResume(jobDesc, candidateInfo, "word");
      
      // Trigger download
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
    } catch (e) { 
      setErr(e.message); 
    } finally {
      setGenerating(false);
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
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Candidate</Typography>
        <Button component={RouterLink} to="/" variant="text">← Back</Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {fullName({ first_name: cand.first_name, last_name: cand.last_name })}
        </Typography>
        <Stack direction={{ xs:"column", sm:"row" }} spacing={3}>
          <Typography><b>Email:</b> {cand.email || "-"}</Typography>
          <Typography><b>Phone:</b> {cand.phone || "-"}</Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Add Job Note & Generate Resume</Typography>
        {err && <Typography color="error" sx={{ mb: 1 }}>{err}</Typography>}
        <Stack direction={{ xs:"column", sm:"row" }} spacing={2}>
          <TextField
            label="Job ID"
            value={jobId}
            onChange={(e)=>setJobId(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            disabled={generating}
          />
          <TextField
            label="Job Description"
            value={jobDesc}
            onChange={(e)=>setJobDesc(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={2}
            sx={{ flex: 3 }}
            disabled={generating}
          />
          <Button 
            variant="contained" 
            onClick={addJob} 
            disabled={generating || !jobId || !jobDesc}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {generating ? "Generating..." : "Add & Generate"}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          When you click "Add & Generate", the system will:
          <br />1. Save the job description
          <br />2. Generate a tailored resume using AI
          <br />3. Automatically download the Word document
        </Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Jobs for this Candidate</Typography>
        <Divider sx={{ mb: 2 }} />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Job ID</TableCell>
              <TableCell>Job Description</TableCell>
              <TableCell>Time</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(cand.jobs || []).map(j => (
              <TableRow key={j.id}>
                <TableCell sx={{ whiteSpace:"nowrap" }}>{j.job_id}</TableCell>
                <TableCell>
                  {j.job_description.length > 100 
                    ? j.job_description.substring(0, 100) + '...' 
                    : j.job_description}
                </TableCell>
                <TableCell sx={{ whiteSpace:"nowrap" }}>
                  {new Date(j.created_at).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="outlined" onClick={()=>handleViewJob(j)}>View</Button>
                    <Button size="small" variant="outlined" color="primary" onClick={()=>handleEditJob(j)}>Edit</Button>
                    <Button size="small" color="error" onClick={()=>removeJob(j.id)}>Delete</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {(!cand.jobs || cand.jobs.length===0) && (
              <TableRow><TableCell colSpan={4}>No rows yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* View Job Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Job Details</DialogTitle>
        <DialogContent>
          {viewJob && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Job ID</Typography>
                <Typography variant="body1">{viewJob.job_id}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Job Description</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {viewJob.job_description}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                <Typography variant="body1">
                  {new Date(viewJob.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Job</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Job ID"
              value={editJobId}
              onChange={(e) => setEditJobId(e.target.value)}
              fullWidth
            />
            <TextField
              label="Job Description"
              value={editJobDesc}
              onChange={(e) => setEditJobDesc(e.target.value)}
              fullWidth
              multiline
              rows={6}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateJob} 
            variant="contained" 
            disabled={!editJobId || !editJobDesc}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
