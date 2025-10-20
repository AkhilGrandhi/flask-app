// src/pages/CandidateDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Container, Box, Paper, Typography, Stack, Divider,
  TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress
} from "@mui/material";
import { getCandidate, addCandidateJob, deleteCandidateJob, generateResume } from "../api";
import { fullName } from "../utils/display";

export default function CandidateDetail() {
  const { id } = useParams();
  const [cand, setCand] = useState(null);
  const [jobId, setJobId] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [err, setErr] = useState("");
  const [generating, setGenerating] = useState(false);

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
                <TableCell>{j.job_description}</TableCell>
                <TableCell sx={{ whiteSpace:"nowrap" }}>
                  {new Date(j.created_at).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <Button size="small" color="error" onClick={()=>removeJob(j.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {(!cand.jobs || cand.jobs.length===0) && (
              <TableRow><TableCell colSpan={4}>No rows yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
