import { useEffect, useState } from "react";
import {
  Tabs, Tab, Container, Box, Typography, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem
} from "@mui/material";

import { useAuth } from "../AuthContext";

import {
  listUsers, createUser, updateUser, deleteUser,
  listAllCandidates, adminUpdateCandidate, adminDeleteCandidate
} from "../api";

import CandidateForm from "../components/CandidateForm";

import { Avatar, Stack } from "@mui/material";
import { fullName, initials } from "../utils/display";



export default function Admin() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:2 }}>
        <Typography variant="h5">Admin Panel</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body1" sx={{ whiteSpace:"nowrap" }}>
            Welcome <b>{fullName(user)}</b>
          </Typography>
          <Avatar sx={{ width: 36, height: 36 }}>{initials(user)}</Avatar>
          <Button onClick={logout} variant="outlined">Logout</Button>
        </Stack>
      </Box>

      <Paper>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} centered>
          <Tab label="Users" />
          <Tab label="Candidates" />
        </Tabs>
        <Box sx={{ p:2 }}>
          {tab === 0 ? <UsersTab /> : <CandidatesTab />}
        </Box>
      </Paper>
    </Container>
  );
}

function UsersTab() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:"", email:"", mobile:"", password:"", role:"user" });
  const [err, setErr] = useState("");

  const load = async () => { const d = await listUsers(); setRows(d.users); };
  useEffect(()=>{ load(); }, []);

  const startCreate = ()=>{ setEditing(null); setForm({ name:"", email:"", mobile:"", password:"", role:"user" }); setOpen(true); };
  const startEdit = (u)=>{ setEditing(u); setForm({ name:u.name, email:u.email, mobile:u.mobile, password:"", role:u.role }); setOpen(true); };

  const submit = async () => {
    try {
      setErr("");
      if (editing) await updateUser(editing.id, form);
      else await createUser(form);
      setOpen(false); await load();
    } catch (e) { setErr(e.message); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this user?")) return;
    await deleteUser(id); await load();
  };

  return (
    <>
      <Box sx={{ display:"flex", justifyContent:"space-between", mb:2 }}>
        <Typography variant="h6">All Users</Typography>
        <Button variant="contained" onClick={startCreate}>Create User</Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Email</TableCell>
            <TableCell>Mobile</TableCell><TableCell>Role</TableCell><TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.id}</TableCell>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.email}</TableCell>
              <TableCell>{r.mobile}</TableCell>
              <TableCell>{r.role}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={()=>startEdit(r)}>Edit</Button>
                <Button size="small" color="error" onClick={()=>remove(r.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <TableRow><TableCell colSpan={6}>No users</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit User" : "Create User"}</DialogTitle>
        <DialogContent sx={{ display:"grid", gap:2, pt:2 }}>
          {err && <Typography color="error">{err}</Typography>}
          <TextField label="Name" value={form.name} onChange={e=>setForm(s=>({...s, name:e.target.value}))} />
          <TextField label="Email" value={form.email} onChange={e=>setForm(s=>({...s, email:e.target.value}))} />
          <TextField label="Mobile" value={form.mobile} onChange={e=>setForm(s=>({...s, mobile:e.target.value}))} />
          <TextField label="Password" type="password" value={form.password} onChange={e=>setForm(s=>({...s, password:e.target.value}))} placeholder={editing ? "(leave blank to keep)" : ""} />
          <Select value={form.role} onChange={e=>setForm(s=>({...s, role:e.target.value}))}>
            <MenuItem value="user">user</MenuItem>
            <MenuItem value="admin">admin</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>{editing ? "Save" : "Create"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function CandidatesTab() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");

  const load = async () => {
    const d = await listAllCandidates();
    setRows(d.candidates);
  };
  useEffect(()=>{ load(); }, []);

  const startEdit = (r) => {
    setEditing(r);
    // Ensure birthdate is YYYY-MM-DD for the date input (if present)
    const bd = r.birthdate ? r.birthdate.slice(0,10) : "";
    setForm({ ...r, birthdate: bd });
    setOpen(true);
  };

  const submit = async () => {
    try {
      setErr("");
      await adminUpdateCandidate(editing.id, form);
      setOpen(false);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this candidate?")) return;
    await adminDeleteCandidate(id);
    await load();
  };

  return (
    <>
      <Typography variant="h6" sx={{ mb:2 }}>All Candidates</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Email</TableCell>
            <TableCell>Phone</TableCell><TableCell>Creator</TableCell><TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.id}</TableCell>
              <TableCell>{r.first_name} {r.last_name}</TableCell>
              <TableCell>{r.email}</TableCell>
              <TableCell>{r.phone}</TableCell>
              <TableCell>{r.created_by?.email}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={()=>startEdit(r)}>Edit</Button>
                <Button size="small" color="error" onClick={()=>remove(r.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <TableRow><TableCell colSpan={6}>No candidates</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Candidate</DialogTitle>
        <DialogContent dividers>
          {err && <Typography color="error" sx={{ mb:1 }}>{err}</Typography>}
          {/* Reuse the same form as the user side */}
          <CandidateForm value={form} onChange={setForm} />
          <Typography variant="caption" sx={{opacity:.7}}>
            Creator: {editing?.created_by?.email || "—"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

