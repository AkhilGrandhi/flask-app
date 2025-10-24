import { useEffect, useState } from "react";
import {
  Container, Box, Typography, Paper, Table, TableHead,
  TableRow, TableCell, TableBody, Button, Avatar, Stack, Card, CardContent, Grid
} from "@mui/material";
import { useAuth } from "../AuthContext";
import { getMyCandidateProfile } from "../api";
import { fullName, initials } from "../utils/display";

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">My Dashboard</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body1" sx={{ whiteSpace: "nowrap" }}>
            Welcome <b>{candidate?.first_name} {candidate?.last_name}</b>
          </Typography>
          <Avatar sx={{ width: 40, height: 40 }}>
            {candidate?.first_name?.[0]}{candidate?.last_name?.[0]}
          </Avatar>
          <Button onClick={logout} variant="outlined">Logout</Button>
        </Stack>
      </Box>

      {/* Basic Information Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Basic Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Full Name
                </Typography>
                <Typography variant="h6">
                  {candidate?.first_name} {candidate?.last_name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Email Address
                </Typography>
                <Typography variant="h6" sx={{ wordBreak: "break-word" }}>
                  {candidate?.email || "Not provided"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Mobile Number
                </Typography>
                <Typography variant="h6">
                  {candidate?.phone || "Not provided"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Jobs Applied Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Jobs Applied
        </Typography>

        {candidate?.jobs && candidate.jobs.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Job ID</strong></TableCell>
                <TableCell><strong>Job Description</strong></TableCell>
                <TableCell><strong>Resume Status</strong></TableCell>
                <TableCell><strong>Applied Date</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidate.jobs.map((job) => (
                <TableRow key={job.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {job.job_id}
                  </TableCell>
                  <TableCell>
                    {job.job_description.length > 150
                      ? job.job_description.substring(0, 150) + "..."
                      : job.job_description}
                  </TableCell>
                  <TableCell>
                    {job.resume_content ? (
                      <Typography color="success.main" fontWeight="medium">
                        ✓ Generated
                      </Typography>
                    ) : (
                      <Typography color="text.secondary" fontStyle="italic">
                        Pending
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {new Date(job.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No jobs applied yet
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              You haven't applied to any jobs yet. Check back later!
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

