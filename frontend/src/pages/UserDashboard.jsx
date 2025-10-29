import { useEffect, useState } from "react";
import {
  Container, Box, Typography, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Stack, Grid, Alert,
  Snackbar, CircularProgress, TextField, IconButton, Tooltip
} from "@mui/material";
import { Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { listMyCandidates, createCandidate, updateCandidate, deleteCandidate } from "../api";
import CandidateForm from "../components/CandidateForm";
import LoadingSpinner from "../components/LoadingSpinner";
import { fullName, initials } from "../utils/display";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  
  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const d = await listMyCandidates();
      setRows(d.candidates);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

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
    setFieldErrors({});
    setErr("");
    setOpen(true); 
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
      setSubmitting(true);
      setErr("");
      setFieldErrors({});
      
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
      
      if (editing) await updateCandidate(editing.id, dataToSend);
      else await createCandidate(dataToSend);
      
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
    await deleteCandidate(id);
    await load();
  };

  if (loading) {
    return <LoadingSpinner message="Loading your candidates..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 0 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        mb: 2,
        pb: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <img 
            src="/only_logo.png" 
            alt="Data Fyre Logo" 
            style={{ height: "40px", width: "auto", objectFit: "contain" }}
          />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.2, fontSize: "1.25rem" }}>
              My Candidates
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
              Manage and track all your candidates
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ textAlign: "right", mr: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
              {fullName(user)}
            </Typography>
          </Box>
          <Avatar sx={{ 
            width: 36, 
            height: 36, 
            bgcolor: "primary.main",
            fontSize: "0.95rem",
            fontWeight: 600
          }}>
            {initials(user)}
          </Avatar>
          <Button onClick={logout} variant="outlined" color="error" size="small" sx={{ fontSize: "0.8rem" }}>
            Logout
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards - Compact */}
      <Box sx={{ mb: 1.5 }}>
        <Grid container spacing={1.5}>
          {/* Total Candidates Card */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 1.5, 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.1, fontSize: "1.5rem" }}>
                  {rows.length}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: "0.75rem" }}>
                  Total Candidates
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: "50%", 
                  bgcolor: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem"
                }}
              >
                👥
              </Box>
            </Paper>
          </Grid>

          {/* Total Applications Card */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 1.5, 
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "white",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.1, fontSize: "1.5rem" }}>
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
                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: "0.75rem" }}>
                  Total Applications
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: "50%", 
                  bgcolor: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem"
                }}
              >
                💼
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Candidates Table */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ 
          px: 2,
          py: 1, 
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
            📋 Candidates List
          </Typography>
          
          {/* Filters */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, justifyContent: "flex-end" }}>
            <TextField
              size="small"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Name"
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
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Email"
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
            
            <TextField
              size="small"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Phone"
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
            
            {(nameFilter || emailFilter || phoneFilter) && (
              <Button 
                size="small" 
                variant="contained"
                onClick={() => {
                  setNameFilter("");
                  setEmailFilter("");
                  setPhoneFilter("");
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
            
            <Button 
              variant="contained" 
              size="small"
              startIcon={<Typography sx={{ fontSize: "1rem" }}>👤</Typography>}
              onClick={startAdd}
              sx={{ 
                fontWeight: 600,
                bgcolor: "white",
                color: "primary.main",
                fontSize: "0.75rem",
                px: 1.5,
                height: 32,
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.9)"
                }
              }}
            >
              Add Candidate
            </Button>
          </Box>
        </Box>

        {(() => {
          const filteredRows = rows.filter(r => {
            const name = fullName(r).toLowerCase();
            const email = (r.email || "").toLowerCase();
            const phone = (r.phone || "").toLowerCase();
            
            if (nameFilter && !name.includes(nameFilter.toLowerCase())) return false;
            if (emailFilter && !email.includes(emailFilter.toLowerCase())) return false;
            if (phoneFilter && !phone.includes(phoneFilter.toLowerCase())) return false;
            
            return true;
          });

          return filteredRows.length > 0 ? (
          <Box sx={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>Phone</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}># Applications</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>Actions</TableCell>
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

                  {/* Name with Avatar */}
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ 
                        bgcolor: "primary.main", 
                        width: 32, 
                        height: 32,
                        fontSize: "0.85rem",
                        fontWeight: 600
                      }}>
                        {initials(r)}
                      </Avatar>
                      <Typography sx={{ fontWeight: 500 }}>
                        {fullName(r)}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell sx={{ color: "text.secondary" }}>
                    {r.email || "—"}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {r.phone || "—"}
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      bgcolor: "primary.lighter",
                      color: "primary.main",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      minWidth: 32
                    }}>
                      {r.jobs?.length || 0}
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          component={RouterLink}
                          to={`/candidates/${r.id}`}
                          size="small"
                          color="primary"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => startEdit(r)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => remove(r.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
              {(nameFilter || emailFilter || phoneFilter) ? "No Matching Candidates" : "No Candidates Yet"}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {(nameFilter || emailFilter || phoneFilter) ? "Try adjusting your filters" : "Start by adding your first candidate to the system"}
            </Typography>
            {!(nameFilter || emailFilter || phoneFilter) && (
              <Button 
                variant="contained" 
                size="large"
                onClick={startAdd}
                sx={{ fontWeight: 600 }}
              >
                Add Your First Candidate
              </Button>
            )}
          </Box>
        );
        })()}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editing ? "Edit Candidate" : "Add Candidate"}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {editing ? "Update candidate information" : "Fill in all required fields to add a new candidate"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: "grey.50" }}>
          {err && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {err}
            </Alert>
          )}
          <CandidateForm value={form} onChange={handleFormChange} errors={fieldErrors} isEditing={!!editing} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setOpen(false)} variant="outlined" disabled={submitting}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submit}
            disabled={submitting || Object.keys(fieldErrors).length > 0}
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

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          bgcolor: 'white',
          borderTop: '1px solid',
          borderColor: 'divider',
          py: 1.2,
          mt: 3
        }}
      >
        <Box sx={{ maxWidth: 'lg', mx: 'auto', px: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'center', md: 'center' },
            gap: 1.2
          }}>
            {/* Logo & Copyright */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <img 
                src="/only_logo.png" 
                alt="Data Fyre Logo" 
                style={{ height: "20px", width: "auto", objectFit: "contain" }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                © {new Date().getFullYear()} Data Fyre. All rights reserved.
              </Typography>
            </Box>

            {/* Links */}
            <Stack direction="row" spacing={1.8} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' }, fontSize: '0.8rem' }}>
                About
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' }, fontSize: '0.8rem' }}>
                Help
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' }, fontSize: '0.8rem' }}>
                Privacy
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' }, fontSize: '0.8rem' }}>
                Terms
              </Typography>
            </Stack>

            {/* Contact */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  📧 support@datafyre.com
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
