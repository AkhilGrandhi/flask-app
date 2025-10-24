import { useEffect, useState } from "react";
import {
  Tabs, Tab, Container, Box, Typography, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, IconButton, InputAdornment
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

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
  const [showPassword, setShowPassword] = useState(false);

  const load = async () => { const d = await listUsers(); setRows(d.users); };
  useEffect(()=>{ load(); }, []);

  const startCreate = ()=>{ setEditing(null); setForm({ name:"", email:"", mobile:"", password:"", role:"user" }); setShowPassword(false); setOpen(true); };
  const startEdit = (u)=>{ setEditing(u); setForm({ name:u.name, email:u.email, mobile:u.mobile, password:"", role:u.role }); setShowPassword(false); setOpen(true); };

  const submit = async () => {
    try {
      setErr("");
      
      // Client-side validation
      if (form.mobile && !/^\d+$/.test(form.mobile)) {
        setErr("Mobile number must contain only numbers");
        return;
      }
      
      if (!editing && (!form.password || form.password.length < 6)) {
        setErr("Password must be at least 6 characters");
        return;
      }
      
      if (editing && form.password && form.password.length < 6) {
        setErr("Password must be at least 6 characters");
        return;
      }
      
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
          <TextField 
            label="Name" 
            value={form.name} 
            onChange={e=>setForm(s=>({...s, name:e.target.value}))} 
            required 
          />
          <TextField 
            label="Email" 
            type="email"
            value={form.email} 
            onChange={e=>setForm(s=>({...s, email:e.target.value}))} 
            required 
          />
          <TextField 
            label="Mobile" 
            type="number"
            value={form.mobile} 
            onChange={e=>setForm(s=>({...s, mobile:e.target.value}))} 
            helperText="Numbers only"
            required 
          />
          <TextField 
            label="Password" 
            type={showPassword ? "text" : "password"}
            value={form.password} 
            onChange={e=>setForm(s=>({...s, password:e.target.value}))} 
            placeholder={editing ? "(leave blank to keep)" : ""} 
            helperText="Minimum 6 characters"
            required={!editing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
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
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const load = async () => {
    const d = await listAllCandidates();
    setRows(d.candidates);
  };
  useEffect(()=>{ load(); }, []);

  // Check for duplicate email or phone in existing candidates
  const checkDuplicates = (field, value) => {
    if (!value) return null;
    
    const currentEditingId = editing ? editing.id : null;
    
    if (field === "email") {
      const duplicate = rows.find(c => 
        c.email.toLowerCase() === value.toLowerCase() && 
        c.id !== currentEditingId
      );
      if (duplicate) {
        return `Candidate "${duplicate.first_name} ${duplicate.last_name}" (ID: ${duplicate.id}) already exists with this email`;
      }
    }
    
    if (field === "phone") {
      const duplicate = rows.find(c => 
        String(c.phone) === String(value) && 
        c.id !== currentEditingId
      );
      if (duplicate) {
        return `Candidate "${duplicate.first_name} ${duplicate.last_name}" (ID: ${duplicate.id}) already exists with this phone number`;
      }
    }
    
    return null;
  };

  const handleFormChange = (newForm) => {
    setForm(newForm);
    
    // Clear field errors when user starts typing
    const newFieldErrors = { ...fieldErrors };
    
    // Check for duplicates on email/phone changes
    if (newForm.email !== form.email) {
      const emailError = checkDuplicates("email", newForm.email);
      if (emailError) {
        newFieldErrors.email = emailError;
      } else {
        delete newFieldErrors.email;
      }
    }
    
    if (newForm.phone !== form.phone) {
      const phoneError = checkDuplicates("phone", newForm.phone);
      if (phoneError) {
        newFieldErrors.phone = phoneError;
      } else {
        delete newFieldErrors.phone;
      }
    }
    
    setFieldErrors(newFieldErrors);
  };

  const startView = (r) => {
    setViewing(r);
    setViewOpen(true);
  };

  const startEdit = (r) => {
    setEditing(r);
    // Ensure birthdate is YYYY-MM-DD for the date input (if present)
    const bd = r.birthdate ? r.birthdate.slice(0,10) : "";
    setForm({ ...r, birthdate: bd });
    setFieldErrors({});
    setErr("");
    setOpen(true);
  };

  const submit = async () => {
    try {
      setErr("");
      
      // Check for duplicate email/phone first
      const emailError = checkDuplicates("email", form.email);
      const phoneError = checkDuplicates("phone", form.phone);
      
      if (emailError || phoneError) {
        const newFieldErrors = {};
        if (emailError) newFieldErrors.email = emailError;
        if (phoneError) newFieldErrors.phone = phoneError;
        setFieldErrors(newFieldErrors);
        setErr("Please fix the duplicate email or phone number errors before submitting.");
        return;
      }
      
      // Client-side validation
      const required = ["first_name", "last_name", "email", "phone", "birthdate", "gender", 
                        "nationality", "citizenship_status", "visa_status", "work_authorization",
                        "address_line1", "address_line2", "city", "state", "postal_code", "country",
                        "technical_skills", "work_experience"];
      
      const missing = required.filter(f => !form[f] || String(form[f]).trim() === "");
      if (missing.length > 0) {
        setErr(`Please fill in all required fields: ${missing.join(", ")}`);
        return;
      }
      
      // Validate email format
      if (!form.email.includes("@")) {
        setErr("Please enter a valid email address");
        return;
      }
      
      // Validate phone - only digits
      if (form.phone && !/^\d+$/.test(String(form.phone))) {
        setErr("Phone number must contain only digits");
        return;
      }
      
      await adminUpdateCandidate(editing.id, form);
      setOpen(false);
      setFieldErrors({});
      await load();
    } catch (e) {
      setErr(e.message);
      // Also check if backend returned duplicate errors
      if (e.message.includes("email already exists")) {
        setFieldErrors({ ...fieldErrors, email: e.message });
      }
      if (e.message.includes("phone number already exists")) {
        setFieldErrors({ ...fieldErrors, phone: e.message });
      }
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
                <Button size="small" variant="outlined" onClick={()=>startView(r)} sx={{ mr: 1 }}>View</Button>
                <Button size="small" onClick={()=>startEdit(r)} sx={{ mr: 1 }}>Edit</Button>
                <Button size="small" color="error" onClick={()=>remove(r.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <TableRow><TableCell colSpan={6}>No candidates</TableCell></TableRow>}
        </TableBody>
      </Table>

      {/* View Dialog */}
      <Dialog open={viewOpen} onClose={()=>setViewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Candidate Details</DialogTitle>
        <DialogContent dividers>
          {viewing && (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Basic Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>Basic Information</Typography>
                <Typography><strong>ID:</strong> {viewing.id}</Typography>
                <Typography><strong>Name:</strong> {viewing.first_name} {viewing.last_name}</Typography>
                <Typography><strong>Email:</strong> {viewing.email || "Not specified"}</Typography>
                <Typography><strong>Phone:</strong> {viewing.phone || "Not specified"}</Typography>
                <Typography><strong>Gender:</strong> {viewing.gender || "Not specified"}</Typography>
                <Typography><strong>Nationality:</strong> {viewing.nationality || "Not specified"}</Typography>
                <Typography><strong>Creator:</strong> {viewing.created_by?.email || "Not specified"}</Typography>
              </Box>

              {/* Jobs Table */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Jobs for this Candidate {viewing.jobs && viewing.jobs.length > 0 ? `(${viewing.jobs.length})` : ''}
                </Typography>
                {viewing.jobs && viewing.jobs.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Job ID</strong></TableCell>
                        <TableCell><strong>Job Description</strong></TableCell>
                        <TableCell><strong>Resume</strong></TableCell>
                        <TableCell><strong>Created</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewing.jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{job.job_id}</TableCell>
                          <TableCell>
                            {job.job_description.length > 100 
                              ? job.job_description.substring(0, 100) + '...' 
                              : job.job_description}
                          </TableCell>
                          <TableCell>
                            {job.resume_content ? (
                              job.resume_content.length > 50 
                                ? job.resume_content.substring(0, 50) + '...' 
                                : job.resume_content
                            ) : (
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                Not generated
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {new Date(job.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color="text.secondary">No job applications yet</Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Candidate</DialogTitle>
        <DialogContent dividers>
          {err && <Typography color="error" sx={{ mb:1, fontWeight: "bold" }}>{err}</Typography>}
          {/* Reuse the same form as the user side */}
          <CandidateForm value={form} onChange={handleFormChange} errors={fieldErrors} />
          <Typography variant="caption" sx={{opacity:.7}}>
            Creator: {editing?.created_by?.email || "—"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submit}
            disabled={Object.keys(fieldErrors).length > 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

