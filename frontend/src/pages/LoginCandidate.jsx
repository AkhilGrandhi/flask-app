import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Paper, TextField, Button, Typography, Box,
  Alert, IconButton, InputAdornment, Divider
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { loginCandidate, meApi } from "../api";
import { useAuth } from "../AuthContext";
import logo from "../assets/logo.png";

export default function LoginCandidate() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
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
      const me = await meApi();
      setUser(me.user);
      navigate("/candidate-dashboard", { replace: true });
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <img 
            src={logo} 
            alt="Data Fyre Logo" 
            style={{ maxWidth: "200px", height: "auto" }}
          />
        </Box>
        <Typography variant="h4" sx={{ mb: 1, textAlign: "center", fontWeight: 600 }}>
          Candidate Login
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
          Sign in with your phone number
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}

        <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2.5 }}>
          <TextField
            label="Phone Number"
            type="number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            fullWidth
            variant="outlined"
          />

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            variant="outlined"
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

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            sx={{ mt: 1, py: 1.5 }}
          >
            Login
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button onClick={() => navigate("/login")} size="small" variant="text">
            User Login
          </Button>
          <Button onClick={() => navigate("/login-admin")} size="small" variant="text">
            Admin Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

