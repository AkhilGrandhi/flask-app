// src/pages/CandidateDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Container, Box, Paper, Typography, Stack, Divider,
  TextField, Button, Table, TableHead, TableRow, TableCell, TableBody
} from "@mui/material";
import { getCandidate, addCandidateJob, deleteCandidateJob } from "../api";
import { fullName } from "../utils/display";

export default function CandidateDetail() {
  const { id } = useParams();
  const [cand, setCand] = useState(null);
  const [jobId, setJobId] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    const d = await getCandidate(id);
    setCand(d);
  };

  useEffect(() => { load(); }, [id]);

  const addJob = async () => {
    try {
      setErr("");
      await addCandidateJob(id, { job_id: jobId, job_description: jobDesc });
      setJobId(""); setJobDesc("");
      await load();
    } catch (e) { setErr(e.message); }
  };

  const removeJob = async (rowId) => {
    await deleteCandidateJob(id, rowId);
    await load();
  };

  if (!cand) return null;

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
        <Typography variant="h6" sx={{ mb: 1 }}>Add Job Note</Typography>
        {err && <Typography color="error" sx={{ mb: 1 }}>{err}</Typography>}
        <Stack direction={{ xs:"column", sm:"row" }} spacing={2}>
          <TextField
            label="Job ID"
            value={jobId}
            onChange={(e)=>setJobId(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Job Description"
            value={jobDesc}
            onChange={(e)=>setJobDesc(e.target.value)}
            size="small"
            fullWidth
            sx={{ flex: 3 }}
          />
          <Button variant="contained" onClick={addJob}>Add</Button>
        </Stack>
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
