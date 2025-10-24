import { useEffect, useState } from "react";
import {
  Container, Box, Typography, Paper, Table, TableHead,
  TableRow, TableCell, TableBody, Button, Avatar, Stack, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Divider, TextField, Alert
} from "@mui/material";
import {
  PersonOutline, EmailOutlined, PhoneOutlined,
  WorkOutlineOutlined, VisibilityOutlined
} from "@mui/icons-material";
import { useAuth } from "../AuthContext";
import { getMyCandidateProfile } from "../api";

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyCandidateProfile();
      setCandidate(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            My Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Welcome back, {candidate?.first_name}!
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main", fontSize: "1.2rem" }}>
            {candidate?.first_name?.[0]}{candidate?.last_name?.[0]}
          </Avatar>
          <Button onClick={logout} variant="outlined" color="error">
            Logout
          </Button>
        </Stack>
      </Box>

      {/* Basic Information Card */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Profile Overview
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<VisibilityOutlined />}
              onClick={() => setDetailsOpen(true)}
            >
              View Full Details
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setEditForm(candidate);
                setEditError("");
                setEditOpen(true);
              }}
            >
              Edit Details
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {/* Full Name */}
          <Box sx={{ display: "flex", alignItems: "center", flex: "1 1 300px" }}>
            <Avatar sx={{ bgcolor: "primary.main", mr: 1.5, width: 32, height: 32 }}>
              <PersonOutline sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                Full Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {candidate?.first_name} {candidate?.last_name}
              </Typography>
            </Box>
          </Box>

          {/* Email Address */}
          <Box sx={{ display: "flex", alignItems: "center", flex: "1 1 300px" }}>
            <Avatar sx={{ bgcolor: "success.main", mr: 1.5, width: 32, height: 32 }}>
              <EmailOutlined sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                Email Address
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: "break-word" }}>
                {candidate?.email || "Not provided"}
              </Typography>
            </Box>
          </Box>

          {/* Mobile Number */}
          <Box sx={{ display: "flex", alignItems: "center", flex: "1 1 300px" }}>
            <Avatar sx={{ bgcolor: "warning.main", mr: 1.5, width: 32, height: 32 }}>
              <PhoneOutlined sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                Mobile Number
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {candidate?.phone || "Not provided"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Jobs Applied Section */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Jobs Applied
          </Typography>
          {candidate?.jobs && candidate.jobs.length > 0 && (
            <Chip
              label={`${candidate.jobs.length} Application${candidate.jobs.length !== 1 ? 's' : ''}`}
              color="primary"
              size="small"
            />
          )}
        </Box>

        {candidate?.jobs && candidate.jobs.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Job ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Job Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Resume Content</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Resume Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Applied Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidate.jobs.map((job) => (
                <TableRow key={job.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 500 }}>
                    {job.job_id}
                  </TableCell>
                  <TableCell>
                    {job.job_description.length > 100
                      ? job.job_description.substring(0, 100) + "..."
                      : job.job_description}
                  </TableCell>
                  <TableCell>
                    {job.resume_content ? (
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {job.resume_content.length > 80
                          ? job.resume_content.substring(0, 80) + "..."
                          : job.resume_content}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Not generated yet
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.resume_content ? (
                      <Chip label="Generated" color="success" size="small" />
                    ) : (
                      <Chip label="Pending" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {new Date(job.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedJob(job);
                        setResumeOpen(true);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <WorkOutlineOutlined sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No jobs applied yet
            </Typography>
            <Typography color="text.secondary">
              You haven't applied to any jobs yet. Check back later!
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Edit Details Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Edit Profile Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="First Name"
              value={editForm.first_name || ""}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={editForm.last_name || ""}
              onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={editForm.email || ""}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Phone"
              type="number"
              value={editForm.phone || ""}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              fullWidth
              required
              helperText="Cannot be changed"
              disabled
            />
            <TextField
              label="Address Line 1"
              value={editForm.address_line1 || ""}
              onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address Line 2"
              value={editForm.address_line2 || ""}
              onChange={(e) => setEditForm({ ...editForm, address_line2: e.target.value })}
              fullWidth
            />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                label="City"
                value={editForm.city || ""}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                fullWidth
              />
              <TextField
                label="State"
                value={editForm.state || ""}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                fullWidth
              />
            </Box>
            <TextField
              label="Postal Code"
              value={editForm.postal_code || ""}
              onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
              fullWidth
            />
            <TextField
              label="Technical Skills"
              value={editForm.technical_skills || ""}
              onChange={(e) => setEditForm({ ...editForm, technical_skills: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Work Experience"
              value={editForm.work_experience || ""}
              onChange={(e) => setEditForm({ ...editForm, work_experience: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                setEditError("");
                // Note: You'll need to create an API endpoint for candidates to update their own profile
                // For now, showing a message
                setEditError("Profile update feature coming soon! Contact your recruiter for updates.");
                // When API is ready, use something like:
                // await updateMyCandidateProfile(editForm);
                // setCandidate(editForm);
                // setEditOpen(false);
                // await load();
              } catch (e) {
                setEditError(e.message);
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resume Details Dialog */}
      <Dialog 
        open={resumeOpen} 
        onClose={() => {
          setResumeOpen(false);
          setSelectedJob(null);
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Job Application Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedJob && (
            <Box sx={{ display: "grid", gap: 3 }}>
              {/* Job Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: 600 }}>
                  Job Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Job ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedJob.job_id}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Job Description</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>
                      {selectedJob.job_description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Applied Date</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(selectedJob.created_at).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Resume Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {selectedJob.resume_content ? (
                        <Chip label="Generated" color="success" size="small" />
                      ) : (
                        <Chip label="Pending" size="small" variant="outlined" />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Resume Content */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: 600 }}>
                  Resume Content
                </Typography>
                {selectedJob.resume_content ? (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: "grey.50",
                      maxHeight: 400,
                      overflow: "auto"
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {selectedJob.resume_content}
                    </Typography>
                  </Paper>
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
                    <Typography color="text.secondary">
                      Resume has not been generated yet for this job application.
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResumeOpen(false);
            setSelectedJob(null);
          }} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Complete Profile Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {candidate && (
            <Box sx={{ display: "grid", gap: 3 }}>
              {/* Personal Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: 600 }}>
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">First Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.first_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Last Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.last_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.phone}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Birthdate</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {candidate.birthdate ? new Date(candidate.birthdate).toLocaleDateString() : "Not provided"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.gender || "Not provided"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Address Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: 600 }}>
                  Address Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Address Line 1</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.address_line1 || "Not provided"}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Address Line 2</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.address_line2 || "Not provided"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">City</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.city || "Not provided"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">State</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.state || "Not provided"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Postal Code</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.postal_code || "Not provided"}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Country</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.country || "Not provided"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Work Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: 600 }}>
                  Work Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Nationality</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.nationality || "Not provided"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Citizenship Status</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.citizenship_status || "Not provided"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Visa Status</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.visa_status || "Not provided"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Work Authorization</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{candidate.work_authorization || "Not provided"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Skills & Experience */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: 600 }}>
                  Skills & Experience
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Technical Skills</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>
                      {candidate.technical_skills || "Not provided"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Work Experience</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>
                      {candidate.work_experience || "Not provided"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Education</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>
                      {candidate.education || "Not provided"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Certificates</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>
                      {candidate.certificates || "Not provided"}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Online Presence */}
              {(candidate.personal_website || candidate.linkedin || candidate.github) && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: 600 }}>
                      Online Presence
                    </Typography>
                    <Grid container spacing={2}>
                      {candidate.personal_website && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Personal Website</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            <a href={candidate.personal_website} target="_blank" rel="noopener noreferrer">
                              {candidate.personal_website}
                            </a>
                          </Typography>
                        </Grid>
                      )}
                      {candidate.linkedin && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">LinkedIn</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer">
                              {candidate.linkedin}
                            </a>
                          </Typography>
                        </Grid>
                      )}
                      {candidate.github && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">GitHub</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            <a href={candidate.github} target="_blank" rel="noopener noreferrer">
                              {candidate.github}
                            </a>
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

