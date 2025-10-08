import { useEffect, useState } from "react";
import { Container, Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody,
         Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useAuth } from "../AuthContext";
import { listMyCandidates, createCandidate, updateCandidate, deleteCandidate } from "../api";
import CandidateForm from "../components/CandidateForm";
import { Avatar, Stack } from "@mui/material";
import { fullName, initials } from "../utils/display";


export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");

  const load = async () => { const d = await listMyCandidates(); setRows(d.candidates); };
  useEffect(()=>{ load(); }, []);

  const startAdd = () => { setEditing(null); setForm({}); setOpen(true); };
  const startEdit = (r) => { setEditing(r); setForm(r); setOpen(true); };

  const submit = async () => {
    try {
      setErr("");
      if (editing) await updateCandidate(editing.id, form);
      else await createCandidate(form);
      setOpen(false); await load();
    } catch (e) { setErr(e.message); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this candidate?")) return;
    await deleteCandidate(id); await load();
  };

  return (
    <Container maxWidth="lg" sx={{ mt:4 }}>
      <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:2 }}>
        <Typography variant="h5">My Candidates</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body1" sx={{ whiteSpace:"nowrap" }}>
            Welcome <b>{fullName(user)}</b>
          </Typography>
          <Avatar sx={{ width: 36, height: 36 }}>{initials(user)}</Avatar>
          <Button onClick={logout} variant="outlined">Logout</Button>
        </Stack>
      </Box>


      <Paper sx={{ p:2 }}>
        <Box sx={{ display:"flex", justifyContent:"space-between", mb:2 }}>
          <Typography variant="h6">{rows.length ? "Candidates" : "No candidates yet"}</Typography>
          <Button variant="contained" onClick={startAdd}>Add Candidate</Button>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Email</TableCell>
              <TableCell>Phone</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.first_name} {r.last_name}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.phone}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={()=>startEdit(r)}>Edit</Button>
                  <Button size="small" color="error" onClick={()=>remove(r.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={5}>No data</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
        <DialogContent dividers>
          {err && <Typography color="error" sx={{ mb:1 }}>{err}</Typography>}
          <CandidateForm value={form} onChange={setForm} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>{editing ? "Save" : "Create"}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
