import { Box, Stack, Typography, Avatar, Button, Chip, Menu, MenuItem } from "@mui/material";
import { VisibilityOutlined, PersonOutline } from "@mui/icons-material";
import { useState } from "react";
import logo from "../assets/zero2hirelogo.png";

export default function CandidateHeader({ candidate, logout, onViewProfile, onEditProfile }) {
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const profileMenuOpen = Boolean(profileMenuAnchor);

  return (
    <Box sx={{ 
      bgcolor: 'white',
      borderBottom: '1px solid',
      borderColor: 'divider',
      width: '100%',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      flexShrink: 0
    }}>
      <Box sx={{ maxWidth: 'xl', mx: 'auto', px: 3 }}>
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          py: 1.5
        }}>
          {/* Logo and Brand */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <img 
              src={logo} 
              alt="Zero2Hire Logo" 
              style={{ height: "40px", width: "auto", objectFit: "contain" }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.1, fontSize: '1.1rem' }}>
                Zero2Hire
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Candidate Portal
              </Typography>
            </Box>
          </Box>

          {/* User Menu */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip 
              label={candidate?.subscription_type === "Gold" ? "🥇 Gold" : "🥈 Silver"} 
              sx={{ 
                bgcolor: candidate?.subscription_type === "Gold" ? "#FFD700" : "#C0C0C0",
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 24
              }}
              size="small"
            />
            <Box sx={{ textAlign: "right", display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}>
                {candidate?.first_name} {candidate?.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {candidate?.email}
              </Typography>
            </Box>
            <Avatar 
              onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
              sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: "primary.main", 
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              {candidate?.first_name?.[0]}{candidate?.last_name?.[0]}
            </Avatar>
            <Menu
              anchorEl={profileMenuAnchor}
              open={profileMenuOpen}
              onClose={() => setProfileMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              sx={{ mt: 1 }}
            >
              <MenuItem 
                onClick={() => {
                  onViewProfile();
                  setProfileMenuAnchor(null);
                }}
                sx={{ gap: 1, py: 1, px: 2, minWidth: 160 }}
              >
                <VisibilityOutlined sx={{ fontSize: 18 }} />
                <Typography variant="body2">View Profile</Typography>
              </MenuItem>
              {candidate?.subscription_type !== "Gold" && (
                <MenuItem 
                  onClick={() => {
                    onEditProfile();
                    setProfileMenuAnchor(null);
                  }}
                  sx={{ gap: 1, py: 1, px: 2 }}
                >
                  <PersonOutline sx={{ fontSize: 18 }} />
                  <Typography variant="body2">Edit Profile</Typography>
                </MenuItem>
              )}
            </Menu>
            <Button 
              onClick={logout} 
              variant="outlined" 
              size="small"
              sx={{ 
                fontSize: "0.8rem",
                fontWeight: 600
              }}
            >
              Logout
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

