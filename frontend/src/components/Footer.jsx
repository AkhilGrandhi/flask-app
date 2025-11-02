import { Box, Container, Stack, Typography } from "@mui/material";
import datafyreLogo from "../assets/datafyrelogo.png";

export default function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderTop: '1px solid rgba(148, 163, 184, 0.25)',
        color: 'rgba(226,232,240,0.9)',
        py: 1.75,
        mt: 'auto',
        flexShrink: 0,
        boxShadow: '0 -6px 18px rgba(15, 23, 42, 0.25)',
        width: '100%'
      }}
    >
      <Container maxWidth="lg">
        <Stack 
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 1, md: 3 }}
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: '100%' }}
        >
          {/* Left: Logo & Copyright */}
          <Stack spacing={0.4}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.08)', 
                p: 0.75, 
                borderRadius: 1.5, 
                display: 'flex', 
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(15,23,42,0.35)'
              }}>
                <img 
                  src={datafyreLogo} 
                  alt="Data Fyre" 
                  style={{ height: "22px", width: "auto" }}
                />
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  letterSpacing: 0.3
                }}
              >
                © {new Date().getFullYear()} Data Fyre. All rights reserved.
              </Typography>
            </Stack>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                opacity: 0.7,
                ml: 11
              }}
            >
              Powered By Data Fyre PVT LTD
            </Typography>
          </Stack>

          {/* Center: Links */}
          <Stack 
            direction="row" 
            spacing={2.5} 
            alignItems="center"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.85rem', 
                cursor: 'pointer',
                color: 'rgba(226,232,240,0.9)',
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  color: 'white'
                } 
              }}
            >
              About
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.85rem', 
                cursor: 'pointer',
                color: 'white',
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  textDecoration: 'underline'
                } 
              }}
            >
              Privacy
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.85rem', 
                cursor: 'pointer',
                color: 'white',
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  textDecoration: 'underline'
                } 
              }}
            >
              Terms
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.85rem', 
                cursor: 'pointer',
                color: 'white',
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  textDecoration: 'underline'
                } 
              }}
            >
              Help
            </Typography>
          </Stack>

          {/* Right: Contact */}
          <Stack spacing={0.5} alignItems="flex-end">
            <Box sx={{ 
              bgcolor: 'rgba(148,163,184,0.18)', 
              p: 0.85, 
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: 0.2
                }}
              >
                📧 support@zero2hire.com
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Typography 
                component="a" 
                href="https://wa.me/18179662996" 
                target="_blank"
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  color: 'rgba(226,232,240,0.9)',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    color: 'white',
                    transform: 'translateY(-2px)'
                  } 
                }}
              >
                📱 +1 817 966 2996
              </Typography>
              <Typography 
                component="a" 
                href="https://wa.me/19378562492" 
                target="_blank"
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  color: 'rgba(226,232,240,0.9)',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    color: 'white',
                    transform: 'translateY(-2px)'
                  } 
                }}
              >
                📱 (937) 856-2492
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

