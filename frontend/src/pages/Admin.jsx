import { useEffect, useState } from "react";
import {
  Tabs, Tab, Container, Box, Typography, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, IconButton, InputAdornment, Grid, Alert, Autocomplete
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

import { useAuth } from "../AuthContext";

import {
  listUsers, createUser, updateUser, deleteUser,
  listAllCandidates, createCandidate, adminUpdateCandidate, adminDeleteCandidate
} from "../api";

import CandidateForm from "../components/CandidateForm";
import LoadingSpinner from "../components/LoadingSpinner";

import { Avatar, Stack } from "@mui/material";
import { fullName, initials } from "../utils/display";



export default function Admin() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
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
              Admin Panel
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage users and candidates across the entire system
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ textAlign: "right", mr: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {fullName(user)}
          </Typography>
          </Box>
          <Avatar sx={{ 
            width: 48, 
            height: 48, 
            bgcolor: "error.main",
            fontSize: "1.2rem",
            fontWeight: 600
          }}>
            {initials(user)}
          </Avatar>
          <Button onClick={logout} variant="outlined" color="error">
            Logout
          </Button>
        </Stack>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Tabs 
          value={tab} 
          onChange={(_,v)=>setTab(v)} 
          centered
          sx={{
            bgcolor: "grey.50",
            borderBottom: "1px solid",
            borderColor: "divider",
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "1rem",
              py: 2,
              minHeight: 60,
              "&.Mui-selected": {
                color: "primary.main"
              }
            },
            "& .MuiTabs-indicator": {
              height: 3
            }
          }}
        >
          <Tab label="👥 Users" />
          <Tab label="📋 Candidates" />
        </Tabs>
        <Box sx={{ p: 3, pt: 1.5 }}>
          {tab === 0 ? <UsersTab /> : <CandidatesTab />}
        </Box>
      </Paper>
    </Container>
  );
}

function UsersTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:"", email:"", mobile:"", password:"", role:"user" });
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const load = async () => { 
    setLoading(true);
    try {
      const d = await listUsers(); 
      setRows(d.users);
    } finally {
      setLoading(false);
    }
  };
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

  if (loading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  return (
    <>
      {/* Stats Card */}
      <Box sx={{ mb: 4.5 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25 }}>
              {rows.length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.85rem" }}>
              Total Users in System
            </Typography>
          </Box>
          <Box 
            sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: "50%", 
              bgcolor: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem"
            }}
          >
            👤
          </Box>
        </Paper>
      </Box>

      {/* Users Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ 
          px: 2.5,
          py: 1.5, 
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
            All Users
          </Typography>
          <Button 
            variant="contained" 
            onClick={startCreate}
            size="small"
            sx={{ 
              fontWeight: 600,
              px: 2.5,
              py: 0.75,
              boxShadow: 2,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: 4
              },
              transition: "all 0.3s"
            }}
          >
            Create User
          </Button>
        </Box>

        {rows.length > 0 ? (
      <Table size="small">
        <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>Role</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
                <TableRow 
                  key={r.id}
                  hover
                  sx={{ 
                    "&:hover": { 
                      bgcolor: "primary.lighter",
                      cursor: "pointer"
                    },
                    transition: "all 0.2s",
                    "& td": { py: 1 }
                  }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>
                    #{r.id}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                    {r.name}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {r.email}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {r.mobile || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Box 
                      component="span" 
                      sx={{ 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 1, 
                        bgcolor: r.role === "admin" ? "error.light" : "success.light",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase"
                      }}
                    >
                      {r.role}
                    </Box>
                  </TableCell>
              <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button 
                        size="small" 
                        variant="contained"
                        onClick={()=>startEdit(r)}
                        sx={{ 
                          textTransform: "none",
                          fontWeight: 500
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined"
                        color="error" 
                        onClick={()=>remove(r.id)}
                        sx={{ 
                          textTransform: "none",
                          fontWeight: 500
                        }}
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
          <Box sx={{ 
            textAlign: "center", 
            py: 8,
            px: 2
          }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: "auto", 
              mb: 2,
              bgcolor: "primary.lighter"
            }}>
              <Typography variant="h3">👤</Typography>
            </Avatar>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              No Users Yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create your first user to get started
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={startCreate}
              sx={{ fontWeight: 600 }}
            >
              Create Your First User
            </Button>
          </Box>
        )}
      </Paper>

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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignedUserId, setAssignedUserId] = useState("");
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
  
  const loadUsers = async () => {
    const d = await listUsers();
    setUsers(d.users);
  };
  
  useEffect(()=>{ 
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([load(), loadUsers()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
    
    if (field === "ssn") {
      const duplicate = rows.find(c => 
        String(c.ssn) === String(value) && 
        c.id !== currentEditingId
      );
      if (duplicate) {
        return `Candidate "${duplicate.first_name} ${duplicate.last_name}" (ID: ${duplicate.id}) already exists with this SSN`;
      }
    }
    
    return null;
  };

  const handleFormChange = (newForm) => {
    // Clear f1_type if visa_status changes away from "F1"
    if (newForm.visa_status !== form.visa_status && newForm.visa_status !== "F1") {
      newForm = { ...newForm, f1_type: undefined };
    }
    
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
    
    if (newForm.ssn !== form.ssn) {
      const ssnError = checkDuplicates("ssn", newForm.ssn);
      if (ssnError) {
        newFieldErrors.ssn = ssnError;
      } else {
        delete newFieldErrors.ssn;
      }
    }
    
    // Clear visa_status error when user changes it from "None"
    if (newForm.visa_status !== form.visa_status && newForm.visa_status !== "None") {
      delete newFieldErrors.visa_status;
    }
    
    setFieldErrors(newFieldErrors);
  };

  const startView = (r) => {
    setViewing(r);
    setViewOpen(true);
  };

  const startAdd = () => {
    setEditing(null);
    // Initialize form with default values to match CandidateForm defaults
    setForm({
      gender: "Male",
      nationality: "India",
      citizenship_status: "Non-Resident",
      visa_status: "None",
      work_authorization: "Authorized",
      willing_relocate: "Yes",
      willing_travel: "Yes",
      disability_status: "No",
      veteran_status: "Not a Veteran",
      military_experience: "No",
      race_ethnicity: "Asian",
      country: "India",
      at_least_18: "Yes",
      family_in_org: "No",
      subscription_type: "Gold"
    });
    setAssignedUserId("");
    setFieldErrors({});
    setErr("");
    setOpen(true);
  };

  const startEdit = (r) => {
    setEditing(r);
    // Ensure birthdate is YYYY-MM-DD for the date input (if present)
    const bd = r.birthdate ? r.birthdate.slice(0,10) : "";
    setForm({ ...r, birthdate: bd });
    // Set the assigned user to the current creator
    setAssignedUserId(r.created_by?.id || "");
    setFieldErrors({});
    setErr("");
    setOpen(true);
  };

  const submit = async () => {
    try {
      setErr("");
      setFieldErrors({});
      
      // Validate assigned user is selected
      if (!assignedUserId) {
        setErr("Please select a user to assign this candidate to.");
        return;
      }
      
      // Check for duplicate email/phone/ssn first
      const emailError = checkDuplicates("email", form.email);
      const phoneError = checkDuplicates("phone", form.phone);
      const ssnError = checkDuplicates("ssn", form.ssn);
      
      if (emailError || phoneError || ssnError) {
        const newFieldErrors = {};
        if (emailError) newFieldErrors.email = emailError;
        if (phoneError) newFieldErrors.phone = phoneError;
        if (ssnError) newFieldErrors.ssn = ssnError;
        setFieldErrors(newFieldErrors);
        setErr("Please fix the duplicate email, phone number, or SSN errors before submitting.");
        return;
      }
      
      // Client-side validation
      let required = ["first_name", "last_name", "email", "phone", "birthdate", "gender", 
                        "nationality", "citizenship_status", "visa_status", "work_authorization",
                        "address_line1", "city", "state", "postal_code", "country",
                        "work_experience", "education", "subscription_type", "ssn"];
      
      // Password is only required when creating, not when editing
      if (!editing) {
        required.push("password");
      }
      
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
      
      // Validate SSN length
      if (form.ssn && (form.ssn.length < 4 || form.ssn.length > 10)) {
        setErr("SSN must be between 4 and 10 characters");
        return;
      }
      
      // Validate password length if provided
      if (form.password && form.password.length < 6) {
        setErr("Password must be at least 6 characters");
        return;
      }
      
      // Validate visa status - must not be "None"
      if (form.visa_status === "None") {
        setFieldErrors({ visa_status: "Please select a valid visa status. 'None' is not allowed." });
        setErr("Please select a valid visa status.");
        return;
      }
      
      // Clean data for edit mode - don't send empty password
      const dataToSend = { ...form };
      if (editing && (!form.password || form.password.trim() === "")) {
        delete dataToSend.password;
      }
      
      // Add the assigned user ID to the payload (for both create and edit)
      dataToSend.created_by_user_id = assignedUserId;
      
      if (editing) {
        await adminUpdateCandidate(editing.id, dataToSend);
      } else {
        await createCandidate(dataToSend);
      }
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

  if (loading) {
    return <LoadingSpinner message="Loading candidates..." />;
  }

  return (
    <>
      {/* Stats Cards */}
      <Box sx={{ mb: 5.5 }}>
        <Grid container spacing={2}>
          {/* Total Candidates Card */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "white",
                borderRadius: 2,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25 }}>
                  {rows.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.85rem" }}>
                  Total Candidates
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  width: 50, 
                  height: 50, 
                  borderRadius: "50%", 
                  bgcolor: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.6rem"
                }}
              >
                👥
              </Box>
            </Paper>
          </Grid>

          {/* Total Applications Card */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "white",
                borderRadius: 2,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25 }}>
                  {(() => {
                    const jobIds = new Set();
                    rows.forEach(candidate => {
                      candidate.jobs?.forEach(job => {
                        if (job.job_id) jobIds.add(job.job_id);
                      });
                    });
                    return jobIds.size;
                  })()}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.85rem" }}>
                  Total Applications
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  width: 50, 
                  height: 50, 
                  borderRadius: "50%", 
                  bgcolor: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.6rem"
                }}
              >
                💼
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Candidates Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ 
          px: 2.5,
          py: 1.5, 
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
            All Candidates
          </Typography>
          <Button 
            variant="contained" 
            onClick={startAdd}
            size="small"
            sx={{ 
              fontWeight: 600,
              px: 2.5,
              py: 0.75,
              boxShadow: 2,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: 4
              },
              transition: "all 0.3s"
            }}
          >
            Add Candidate
          </Button>
        </Box>

        {rows.length > 0 ? (
      <Table size="small">
        <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>Creator</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "text.primary", py: 1.25 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
                <TableRow 
                  key={r.id}
                  hover
                  sx={{ 
                    "&:hover": { 
                      bgcolor: "primary.lighter",
                      cursor: "pointer"
                    },
                    transition: "all 0.2s",
                    "& td": { py: 1 }
                  }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>
                    #{r.id}
                  </TableCell>
                  {/* Name as a link to details page */}
                  <TableCell>
                    <Button
                      component={RouterLink}
                      to={`/candidates/${r.id}`}
                      sx={{ 
                        textTransform: "none", 
                        p: 0, 
                        minWidth: 0,
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        color: "primary.main",
                        "&:hover": {
                          textDecoration: "underline",
                          bgcolor: "transparent"
                        }
                      }}
                    >
                      {r.first_name} {r.last_name}
                    </Button>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {r.email}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {r.phone}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {r.created_by?.email || "Unknown"}
                  </TableCell>
              <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button 
                        component={RouterLink}
                        to={`/candidates/${r.id}`}
                        size="small" 
                        variant="outlined" 
                        sx={{ 
                          textTransform: "none",
                          fontWeight: 500
                        }}
                      >
                        View
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained"
                        onClick={()=>startEdit(r)}
                        sx={{ 
                          textTransform: "none",
                          fontWeight: 500
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined"
                        color="error" 
                        onClick={()=>remove(r.id)}
                        sx={{ 
                          textTransform: "none",
                          fontWeight: 500
                        }}
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
          <Box sx={{ 
            textAlign: "center", 
            py: 8,
            px: 2
          }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: "auto", 
              mb: 2,
              bgcolor: "primary.lighter"
            }}>
              <Typography variant="h3">👥</Typography>
            </Avatar>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              No Candidates Yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Start by adding your first candidate to the system
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={startAdd}
              sx={{ fontWeight: 600 }}
            >
              Add Your First Candidate
            </Button>
          </Box>
        )}
      </Paper>

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

      {/* Edit/Create Dialog */}
      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editing ? "Edit Candidate" : "Add Candidate"}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {editing 
              ? `Update candidate information • Created by: ${editing?.created_by?.email || "Unknown"}`
              : "Fill in all required fields to add a new candidate"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: "grey.50" }}>
          {err && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {err}
            </Alert>
          )}
          
          {/* Assign User Dropdown - Show for both create and edit */}
          <Paper elevation={1} sx={{ p: 2.5, mb: 3, bgcolor: "white" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "primary.main" }}>
              Assign User (Creator) *
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {editing 
                ? "Change the user who will be assigned as the creator of this candidate"
                : "Select the user who will be assigned as the creator of this candidate"}
            </Typography>
            <Autocomplete
              fullWidth
              options={users.filter(u => u.role === "user")}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={users.find(u => u.id === assignedUserId) || null}
              onChange={(event, newValue) => {
                setAssignedUserId(newValue ? newValue.id : "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search and select a user..."
                  required
                  sx={{ bgcolor: "white" }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText="No users found"
            />
          </Paper>
          
          <CandidateForm value={form} onChange={handleFormChange} errors={fieldErrors} isEditing={!!editing} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={()=>setOpen(false)} variant="outlined">Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submit}
            disabled={Object.keys(fieldErrors).length > 0 || !assignedUserId}
            sx={{ px: 4 }}
          >
            {editing ? "Save Changes" : "Create Candidate"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

