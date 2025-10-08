import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Box, Typography, TextField, Button, Paper } from "@mui/material";
import { loginUser, meApi } from "../api";
import { useAuth } from "../AuthContext";

export default function LoginUser() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const { setUser } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await loginUser(mobile, password);
      const me = await meApi(); setUser(me.user);
      nav("/dashboard", { replace: true });
    } catch (e) { setErr(e.message); }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>User Sign In</Typography>
        {err && <Typography color="error" sx={{ mb:1 }}>{err}</Typography>}
        <Box component="form" onSubmit={onSubmit} sx={{ display:"grid", gap:2 }}>
          <TextField label="Mobile" value={mobile} onChange={e=>setMobile(e.target.value)} required />
          <TextField label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <Button type="submit" variant="contained">Login</Button>
        </Box>
        <Box sx={{ mt:2 }}>
          <Typography variant="body2">Admin? <Link to="/login-admin">Login here</Link></Typography>
        </Box>
      </Paper>
    </Container>
  );
}
