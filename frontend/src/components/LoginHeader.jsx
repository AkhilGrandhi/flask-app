import { Box, Typography } from "@mui/material";
import logo from "../assets/zero2hirelogo.png";

export default function LoginHeader() {
  return (
    <Box 
      sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        width: '100%',
        py: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Box sx={{ maxWidth: 'xl', mx: 'auto', px: 3 }}>
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 1.5 
        }}>
          <Box
            component="img" 
            src={logo} 
            alt="Zero2Hire Logo" 
            sx={{ 
              height: "42px", 
              width: "auto", 
              objectFit: "contain",
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          />
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main', 
              fontSize: '1.6rem',
              letterSpacing: '-0.02em'
            }}
          >
            Zero2Hire
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

