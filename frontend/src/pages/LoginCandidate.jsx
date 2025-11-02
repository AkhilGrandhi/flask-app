import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Paper, TextField, Button, Typography, Box,
  Alert, IconButton, InputAdornment, Divider
} from "@mui/material";
import { Visibility, VisibilityOff, Login as LoginIcon } from "@mui/icons-material";
import { loginCandidate, meApi } from "../api";
import { useAuth } from "../AuthContext";
import LoginHeader from "../components/LoginHeader";
import Footer from "../components/Footer";

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
      navigate("/candidate", { replace: true });
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: '#f0f4f8',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #e0e7ef 100%)'
      }}
    >
      <LoginHeader />
      <Container 
        maxWidth="sm" 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          py: 4
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            width: '100%',
            p: 5,
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            background: 'white',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              boxShadow: '0 15px 50px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)'
            }
          }}
        >
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
              }}
            >
              <LoginIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 1, 
                textAlign: "center", 
                fontWeight: 700,
                color: '#1e293b',
                fontSize: { xs: '1.8rem', sm: '2rem' }
              }}
            >
              Candidate Login
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 3, 
                textAlign: "center",
                color: '#64748b',
                fontSize: '0.95rem'
              }}
            >
              Sign in with your phone number
            </Typography>
          </Box>

          {err && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: 20
                }
              }}
            >
              {err}
            </Alert>
          )}

          <Box 
            component="form" 
            onSubmit={onSubmit} 
            sx={{ display: "grid", gap: 2.5 }}
          >
            <TextField
              label="Phone Number"
              type="number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  transition: 'all 0.3s ease',
                  '& input': {
                    color: '#1e293b'
                  },
                  '& input[type=number]': {
                    MozAppearance: 'textfield'
                  },
                  '& input[type=number]::-webkit-outer-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                  },
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#cbd5e1'
                    }
                  },
                  '&.Mui-focused': {
                    bgcolor: '#ffffff',
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }
                  },
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                    borderWidth: '1.5px'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  color: '#64748b'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#667eea',
                  fontWeight: 600
                }
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  transition: 'all 0.3s ease',
                  '& input': {
                    color: '#1e293b'
                  },
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#cbd5e1'
                    }
                  },
                  '&.Mui-focused': {
                    bgcolor: '#ffffff',
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }
                  },
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                    borderWidth: '1.5px'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  color: '#64748b'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#667eea',
                  fontWeight: 600
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: '#64748b',
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.08)'
                        }
                      }}
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
              startIcon={<LoginIcon />}
              sx={{ 
                mt: 2, 
                py: 1.6,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3d91 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              LOGIN
            </Button>
          </Box>

          <Divider sx={{ my: 3.5, '&::before, &::after': { borderColor: 'rgba(148, 163, 184, 0.2)' } }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', px: 2 }}>
              Or continue with
            </Typography>
          </Divider>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: 'wrap' }}>
            <Button 
              onClick={() => navigate("/login")} 
              size="medium" 
              variant="text"
              sx={{
                color: '#667eea',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.08)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              User Login
            </Button>
            <Button 
              onClick={() => navigate("/admin/login")} 
              size="medium" 
              variant="text"
              sx={{
                color: '#667eea',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.08)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Admin Login
            </Button>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
}

