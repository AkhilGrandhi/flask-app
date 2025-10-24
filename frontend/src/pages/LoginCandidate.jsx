import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Paper, TextField, Button, Typography, Box,
  Alert, IconButton, InputAdornment
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { loginCandidate } from "../api";
import { useAuth } from "../AuthContext";

export default function LoginCandidate() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      setErr("");
      
      // Validate inputs
      if (!phone || !password) {
        setErr("Please enter both phone number and password");
        return;
      }
      
      if (!/^\d+$/.test(phone)) {
        setErr("Phone number must contain only digits");
        return;
      }
      
      if (password.length < 6) {
        setErr("Password must be at least 6 characters");
        return;
      }

      await loginCandidate(phone, password);
      
      // Fetch user info
      const { user } = await (await fetch("/api/auth/me", { credentials: "include" })).json();
      setUser(user);
      
      navigate("/candidate-dashboard");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: "center" }}>
          Candidate Login
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Phone Number"
            type="number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            fullWidth
            helperText="Enter the phone number you registered with"
          />

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            helperText="Minimum 6 characters"
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

          <Button type="submit" variant="contained" size="large" fullWidth>
            Login
          </Button>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 1 }}>
            <Button onClick={() => navigate("/login")} size="small">
              User Login
            </Button>
            <Button onClick={() => navigate("/login-admin")} size="small">
              Admin Login
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

