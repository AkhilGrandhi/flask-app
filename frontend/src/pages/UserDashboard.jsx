import { useEffect, useState } from "react";
import {
  Container, Box, Typography, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Stack
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
      family_in_org: "No"
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
      
      if (editing) await updateCandidate(editing.id, form);
      else await createCandidate(form);
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">My Candidates</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body1" sx={{ whiteSpace: "nowrap" }}>
            Welcome <b>{fullName(user)}</b>
          </Typography>
          <Avatar sx={{ width: 36, height: 36 }}>{initials(user)}</Avatar>
          <Button onClick={logout} variant="outlined">Logout</Button>
        </Stack>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">{rows.length ? "Candidates" : "No candidates yet"}</Typography>
          <Button variant="contained" onClick={startAdd}>Add Candidate</Button>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} hover>
                <TableCell>{r.id}</TableCell>

                {/* Name as a link to details page */}
                <TableCell>
                  <Button
                    component={RouterLink}
                    to={`/candidates/${r.id}`}
                    size="small"
                    sx={{ textTransform: "none", p: 0, minWidth: 0 }}
                  >
                    {r.first_name} {r.last_name}
                  </Button>
                </TableCell>

                <TableCell>{r.email}</TableCell>
                <TableCell>{r.phone}</TableCell>
                <TableCell align="right">
                  <Button
                    component={RouterLink}
                    to={`/candidates/${r.id}`}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  >
                    View
                  </Button>
                  <Button size="small" onClick={() => startEdit(r)} sx={{ mr: 1 }}>
                    Edit
                  </Button>
                  <Button size="small" color="error" onClick={() => remove(r.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No data</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
        <DialogContent dividers>
          {err && <Typography color="error" sx={{ mb: 1, fontWeight: "bold" }}>{err}</Typography>}
          <CandidateForm value={form} onChange={handleFormChange} errors={fieldErrors} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submit}
            disabled={Object.keys(fieldErrors).length > 0}
          >
            {editing ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
