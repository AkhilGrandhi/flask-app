import { useEffect, useState } from "react";
import {
  Container, Box, Typography, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Stack, Grid, Alert
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { listMyCandidates, createCandidate, updateCandidate, deleteCandidate } from "../api";
import CandidateForm from "../components/CandidateForm";
import { fullName, initials } from "../utils/display";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const load = async () => {
    const d = await listMyCandidates();
    setRows(d.candidates);
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
    setForm(r); 
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
      let required = ["first_name", "last_name", "email", "phone", "birthdate", "gender", 
                        "nationality", "citizenship_status", "visa_status", "work_authorization",
                        "address_line1", "address_line2", "city", "state", "postal_code", "country",
                        "technical_skills", "work_experience", "education", "certificates", "subscription_type"];
      
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
      
      // Validate password length if provided
      if (form.password && form.password.length < 6) {
        setErr("Password must be at least 6 characters");
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
    await deleteCandidate(id);
    await load();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        mb: 1.5,
        pb: 2,
        borderBottom: "2px solid",
        borderColor: "primary.main"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <img 
            src="/only_logo.png" 
            alt="Data Fyre Logo" 
            style={{ height: "70px", width: "auto", objectFit: "contain" }}
          />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              My Candidates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and track all your candidates
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ textAlign: "right", mr: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
              Welcome back
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {fullName(user)}
            </Typography>
          </Box>
          <Avatar sx={{ 
            width: 48, 
            height: 48, 
            bgcolor: "primary.main",
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

      {/* Stats Cards */}
      <Box sx={{ mb: 5.5 }}>
        <Grid container spacing={2}>
          {/* Total Candidates Card */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
            Candidates List
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
                        onClick={() => startEdit(r)}
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
                        onClick={() => remove(r.id)}
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
          <Button onClick={() => setOpen(false)} variant="outlined">Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submit}
            disabled={Object.keys(fieldErrors).length > 0}
            sx={{ px: 4 }}
          >
            {editing ? "Save Changes" : "Create Candidate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
