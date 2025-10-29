import { useEffect, useState } from "react";
import {
  Tabs, Tab, Container, Box, Typography, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, IconButton, InputAdornment, Grid, Alert, Autocomplete,
  Snackbar, CircularProgress
} from "@mui/material";
import { Visibility, VisibilityOff, RemoveRedEye, Edit, Delete } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

import { useAuth } from "../AuthContext";

import {
  listUsers, createUser, updateUser, deleteUser, getUserCandidates,
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
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2, height: "calc(100vh - 32px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header Section */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        mb: 2,
        pb: 1.5,
        borderBottom: "2px solid",
        borderColor: "primary.main",
        flexShrink: 0
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <img 
            src="/only_logo.png" 
            alt="Data Fyre Logo" 
            style={{ height: "45px", width: "auto", objectFit: "contain" }}
          />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.25 }}>
              Admin Panel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
              Manage users and candidates across the entire system
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ textAlign: "right", mr: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
              {fullName(user)}
          </Typography>
          </Box>
          <Avatar sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: "error.main",
            fontSize: "1rem",
            fontWeight: 600
          }}>
            {initials(user)}
          </Avatar>
          <Button onClick={logout} variant="outlined" color="error" size="small">
            Logout
          </Button>
        </Stack>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
        <Tabs 
          value={tab} 
          onChange={(_,v)=>setTab(v)} 
          centered
          sx={{
            bgcolor: "grey.50",
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "0.95rem",
              py: 1.5,
              minHeight: 48,
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
        <Box sx={{ p: 2, pt: 1.5, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
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
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [userCandidates, setUserCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    mobile: "",
    role: ""
  });

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
      setSubmitting(true);
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
      
      setOpen(false);
      setToast({ 
        open: true, 
        message: editing ? '✓ User updated successfully!' : '✓ User created successfully!', 
        severity: 'success' 
      });
      await load();
    } catch (e) { 
      setErr(e.message);
      setToast({ 
        open: true, 
        message: `✗ Failed to ${editing ? 'update' : 'create'} user: ${e.message}`, 
        severity: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this user?")) return;
    await deleteUser(id); await load();
  };

  const viewUserCandidates = async (user) => {
    setViewingUser(user);
    setViewOpen(true);
    setLoadingCandidates(true);
    try {
      const data = await getUserCandidates(user.id);
      setUserCandidates(data.candidates || []);
    } catch (e) {
      setToast({ 
        open: true, 
        message: `Failed to load candidates: ${e.message}`, 
        severity: 'error' 
      });
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Filter rows based on filter criteria
  const filteredRows = rows.filter(row => {
    if (filters.name && !row.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }
    if (filters.email && !row.email.toLowerCase().includes(filters.email.toLowerCase())) {
      return false;
    }
    if (filters.mobile && row.mobile && !row.mobile.includes(filters.mobile)) {
      return false;
    }
    if (filters.role && row.role !== filters.role) {
      return false;
    }
    return true;
  });

  const clearFilters = () => {
    setFilters({
      name: "",
      email: "",
      mobile: "",
      role: ""
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  return (
    <>
      {/* Stats Card */}
      <Box sx={{ mb: 2, flexShrink: 0, width: "100%" }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 1.5, 
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
            borderRadius: 2,
            minHeight: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
              {filteredRows.length} {filteredRows.length !== rows.length && `/ ${rows.length}`}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.8rem" }}>
              {filteredRows.length !== rows.length ? "Filtered Users" : "Total Users in System"}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: "50%", 
              bgcolor: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem"
            }}
          >
            👤
          </Box>
        </Paper>
      </Box>

      {/* Users Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ 
          px: 2,
          py: 1.25, 
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
            All Users
          </Typography>
          <Button 
            variant="contained" 
            onClick={startCreate}
            size="small"
            sx={{ 
              fontWeight: 600,
              px: 2,
              py: 0.5,
              fontSize: "0.85rem",
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

        {/* Filters */}
        <Box 
          component="form"
          autoComplete="off"
          sx={{ 
            px: 2, 
            py: 1.5, 
            bgcolor: "grey.50", 
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0
          }}
          onSubmit={(e) => e.preventDefault()}
        >
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={2.5}>
              <TextField
                size="small"
                fullWidth
                label="Name"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                placeholder="Filter by name"
                id="filter-name-users"
                name="filter-name-users"
                autoComplete="off"
                inputProps={{
                  'data-form-type': 'other',
                  'data-lpignore': 'true'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <TextField
                size="small"
                fullWidth
                label="Email"
                value={filters.email}
                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                placeholder="Filter by email"
                id="filter-email-users"
                name="filter-email-users"
                autoComplete="off"
                inputProps={{
                  'data-form-type': 'other',
                  'data-lpignore': 'true'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <TextField
                size="small"
                fullWidth
                label="Mobile"
                value={filters.mobile}
                onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
                placeholder="Filter by mobile"
                id="filter-mobile-users"
                name="filter-mobile-users"
                autoComplete="off"
                inputProps={{
                  'data-form-type': 'other',
                  'data-lpignore': 'true'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <Select
                size="small"
                fullWidth
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                displayEmpty
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                onClick={clearFilters}
                sx={{ height: "40px" }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Box>

        {filteredRows.length > 0 ? (
          <Box sx={{ flex: 1, overflow: "auto" }}>
      <Table size="small" stickyHeader>
        <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}># Candidates</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRows.map(r => (
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
                  <TableCell>
                    <Box 
                      component="span" 
                      sx={{ 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 1, 
                        bgcolor: "info.light",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "30px"
                      }}
                    >
                      {r.candidate_count || 0}
                    </Box>
                  </TableCell>
              <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton 
                        size="small"
                        onClick={()=>viewUserCandidates(r)}
                        sx={{ 
                          color: "primary.main",
                          "&:hover": {
                            bgcolor: "primary.lighter"
                          }
                        }}
                        title="View Candidates"
                      >
                        <RemoveRedEye fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={()=>startEdit(r)}
                        sx={{ 
                          color: "info.main",
                          "&:hover": {
                            bgcolor: "info.lighter"
                          }
                        }}
                        title="Edit User"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        color="error" 
                        onClick={()=>remove(r.id)}
                        sx={{ 
                          "&:hover": {
                            bgcolor: "error.lighter"
                          }
                        }}
                        title="Delete User"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
          </Box>
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
              {rows.length === 0 ? "No Users Yet" : "No Users Found"}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {rows.length === 0 
                ? "Create your first user to get started" 
                : "No users match your filter criteria. Try adjusting the filters."}
            </Typography>
            {rows.length === 0 ? (
            <Button 
              variant="contained" 
              size="large"
              onClick={startCreate}
              sx={{ fontWeight: 600 }}
            >
              Create Your First User
            </Button>
            ) : (
              <Button 
                variant="outlined" 
                size="large"
                onClick={clearFilters}
                sx={{ fontWeight: 600 }}
              >
                Clear Filters
              </Button>
            )}
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
            id="user-form-name"
            name="user-form-name"
            autoComplete="name"
          />
          <TextField 
            label="Email" 
            type="email"
            value={form.email} 
            onChange={e=>setForm(s=>({...s, email:e.target.value}))} 
            required
            id="user-form-email"
            name="user-form-email"
            autoComplete="email"
          />
          <TextField 
            label="Mobile" 
            type="number"
            value={form.mobile} 
            onChange={e=>setForm(s=>({...s, mobile:e.target.value}))} 
            helperText="Numbers only"
            required
            id="user-form-mobile"
            name="user-form-mobile"
            autoComplete="tel"
          />
          <TextField 
            label="Password" 
            type={showPassword ? "text" : "password"}
            value={form.password} 
            onChange={e=>setForm(s=>({...s, password:e.target.value}))} 
            placeholder={editing ? "(leave blank to keep)" : ""} 
            helperText="Minimum 6 characters"
            required={!editing}
            id="user-form-password"
            name="user-form-password"
            autoComplete={editing ? "new-password" : "new-password"}
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
          <Select 
            value={form.role} 
            onChange={e=>setForm(s=>({...s, role:e.target.value}))}
            id="user-form-role"
            name="user-form-role"
          >
            <MenuItem value="user">user</MenuItem>
            <MenuItem value="admin">admin</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitting ? (editing ? "Saving..." : "Creating...") : (editing ? "Save" : "Create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Candidates Dialog */}
      <Dialog open={viewOpen} onClose={()=>setViewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Candidates for {viewingUser?.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Email: {viewingUser?.email} • Role: {viewingUser?.role}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 300 }}>
          {loadingCandidates ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading candidates...</Typography>
            </Box>
          ) : userCandidates.length > 0 ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Total Candidates: {userCandidates.length}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Visa Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Applications</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userCandidates.map(c => (
                    <TableRow key={c.id} hover>
                      <TableCell>#{c.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                        {c.first_name} {c.last_name}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{c.email}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{c.phone}</TableCell>
                      <TableCell>
                        <Box 
                          component="span" 
                          sx={{ 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1, 
                            bgcolor: "info.light",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: 600
                          }}
                        >
                          {c.visa_status || "N/A"}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box 
                          component="span" 
                          sx={{ 
                            px: 1.5, 
                            py: 0.5, 
                            borderRadius: 1, 
                            bgcolor: "success.light",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: 600
                          }}
                        >
                          {c.jobs?.length || 0}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          component={RouterLink}
                          to={`/candidates/${c.id}`}
                          size="small" 
                          variant="contained"
                          sx={{ 
                            textTransform: "none",
                            fontWeight: 500
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
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
                bgcolor: "grey.200"
              }}>
                <Typography variant="h3">📋</Typography>
              </Avatar>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                No Candidates Found
              </Typography>
              <Typography color="text.secondary">
                This user hasn't created any candidates yet
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={()=>setViewOpen(false)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

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
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  
  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    creator: ""
  });

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
      setSubmitting(true);
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
      setToast({ 
        open: true, 
        message: editing ? '✓ Candidate updated successfully!' : '✓ Candidate created successfully!', 
        severity: 'success' 
      });
      await load();
    } catch (e) {
      setErr(e.message);
      setToast({ 
        open: true, 
        message: `✗ Failed to ${editing ? 'update' : 'create'} candidate: ${e.message}`, 
        severity: 'error' 
      });
      // Also check if backend returned duplicate errors
      if (e.message.includes("email already exists")) {
        setFieldErrors({ ...fieldErrors, email: e.message });
      }
      if (e.message.includes("phone number already exists")) {
        setFieldErrors({ ...fieldErrors, phone: e.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this candidate?")) return;
    await adminDeleteCandidate(id);
    await load();
  };

  // Filter rows based on filter criteria
  const filteredRows = rows.filter(row => {
    const fullName = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
    if (filters.name && !fullName.includes(filters.name.toLowerCase())) {
      return false;
    }
    if (filters.email && row.email && !row.email.toLowerCase().includes(filters.email.toLowerCase())) {
      return false;
    }
    if (filters.phone && row.phone && !String(row.phone).includes(filters.phone)) {
      return false;
    }
    if (filters.creator) {
      const creatorEmail = row.created_by?.email?.toLowerCase() || '';
      if (!creatorEmail.includes(filters.creator.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const clearFilters = () => {
    setFilters({
      name: "",
      email: "",
      phone: "",
      creator: ""
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading candidates..." />;
  }

  return (
    <>
      {/* Stats Cards */}
      <Box sx={{ mb: 2, flexShrink: 0, width: "100%" }}>
        <Grid container spacing={1.5}>
          {/* Total Candidates Card */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 1.5, 
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "white",
                borderRadius: 2,
                minHeight: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
                  {filteredRows.length} {filteredRows.length !== rows.length && `/ ${rows.length}`}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.8rem" }}>
                  {filteredRows.length !== rows.length ? "Filtered Candidates" : "Total Candidates"}
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: "50%", 
                  bgcolor: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem"
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
                p: 1.5, 
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "white",
                borderRadius: 2,
                minHeight: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
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
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.8rem" }}>
                  Total Applications
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: "50%", 
                  bgcolor: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem"
                }}
              >
                💼
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Candidates Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ 
          px: 2,
          py: 1.25, 
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
            All Candidates
          </Typography>
          <Button 
            variant="contained" 
            onClick={startAdd}
            size="small"
            sx={{ 
              fontWeight: 600,
              px: 2,
              py: 0.5,
              fontSize: "0.85rem",
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

        {/* Filters */}
        <Box sx={{ 
          px: 2, 
          py: 1.5, 
          bgcolor: "grey.50", 
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0
        }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={2.5}>
              <TextField
                size="small"
                fullWidth
                label="Name"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                placeholder="Filter by name"
                id="candidate-filter-name"
                name="candidate-filter-name"
                autoComplete="off"
              />
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <TextField
                size="small"
                fullWidth
                label="Email"
                value={filters.email}
                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                placeholder="Filter by email"
                id="candidate-filter-email"
                name="candidate-filter-email"
                autoComplete="off"
              />
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <TextField
                size="small"
                fullWidth
                label="Phone"
                value={filters.phone}
                onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
                placeholder="Filter by phone"
                id="candidate-filter-phone"
                name="candidate-filter-phone"
                autoComplete="off"
              />
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <TextField
                size="small"
                fullWidth
                label="Creator"
                value={filters.creator}
                onChange={(e) => setFilters({ ...filters, creator: e.target.value })}
                placeholder="Filter by creator"
                id="candidate-filter-creator"
                name="candidate-filter-creator"
                autoComplete="off"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                onClick={clearFilters}
                sx={{ height: "40px" }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Box>

        {filteredRows.length > 0 ? (
          <Box sx={{ flex: 1, overflow: "auto" }}>
      <Table size="small" stickyHeader>
        <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>Creator</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100" }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRows.map(r => (
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
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton 
                        component={RouterLink}
                        to={`/candidates/${r.id}`}
                        size="small"
                        sx={{ 
                          color: "primary.main",
                          "&:hover": {
                            bgcolor: "primary.lighter"
                          }
                        }}
                        title="View Candidate"
                      >
                        <RemoveRedEye fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={()=>startEdit(r)}
                        sx={{ 
                          color: "info.main",
                          "&:hover": {
                            bgcolor: "info.lighter"
                          }
                        }}
                        title="Edit Candidate"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        color="error" 
                        onClick={()=>remove(r.id)}
                        sx={{ 
                          "&:hover": {
                            bgcolor: "error.lighter"
                          }
                        }}
                        title="Delete Candidate"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
          </Box>
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
              {rows.length === 0 ? "No Candidates Yet" : "No Candidates Found"}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {rows.length === 0 
                ? "Start by adding your first candidate to the system" 
                : "No candidates match your filter criteria. Try adjusting the filters."}
            </Typography>
            {rows.length === 0 ? (
            <Button 
              variant="contained" 
              size="large"
              onClick={startAdd}
              sx={{ fontWeight: 600 }}
            >
              Add Your First Candidate
            </Button>
            ) : (
              <Button 
                variant="outlined" 
                size="large"
                onClick={clearFilters}
                sx={{ fontWeight: 600 }}
              >
                Clear Filters
              </Button>
            )}
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
          <Button onClick={()=>setOpen(false)} variant="outlined" disabled={submitting}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submit}
            disabled={submitting || Object.keys(fieldErrors).length > 0 || !assignedUserId}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ px: 4 }}
          >
            {submitting ? (editing ? "Saving..." : "Creating...") : (editing ? "Save Changes" : "Create Candidate")}
          </Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
}

