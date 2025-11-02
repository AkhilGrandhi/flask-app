import { Box, Typography } from "@mui/material";
import logo from "../assets/zero2hirelogo.png";

export default function LoginHeader() {
  return (
    <Box 
      sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid',
        borderColor: 'divider',
        width: '100%',
        py: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <Box sx={{ maxWidth: 'lg', mx: 'auto', px: 2 }}>
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 1.5 
        }}>
          <img 
            src={logo} 
            alt="Zero2Hire Logo" 
            style={{ height: "40px", width: "auto", objectFit: "contain" }}
          />
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.5rem' }}>
            Zero2Hire
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

