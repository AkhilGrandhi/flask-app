import { Box, Stack, Typography, Avatar, Button } from "@mui/material";
import logo from "../assets/zero2hirelogo.png";
import { fullName, initials } from "../utils/display";

export default function DashboardHeader({ user, logout, title, subtitle }) {
  return (
    <Box 
      sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid',
        borderColor: 'divider',
        width: '100%',
        py: 1.5,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <Box sx={{ maxWidth: 'xl', mx: 'auto', px: 3 }}>
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center"
        }}>
          {/* Logo and Brand */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <img 
              src={logo} 
              alt="Zero2Hire Logo" 
              style={{ height: "40px", width: "auto", objectFit: "contain" }}
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.2, fontSize: "1.25rem" }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                {subtitle}
              </Typography>
            </Box>
          </Box>

          {/* User Info and Logout */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ textAlign: "right", mr: 0.5, display: { xs: 'none', sm: 'block' } }}>
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
      </Box>
    </Box>
  );
}

