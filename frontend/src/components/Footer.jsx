import { Box, Container, Stack, Typography, Grid } from "@mui/material";
import { Email, Phone } from "@mui/icons-material";
import datafyreLogo from "../assets/datafyrelogo.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      component="footer" 
      sx={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderTop: '1px solid rgba(148, 163, 184, 0.15)',
        color: 'rgba(226, 232, 240, 0.9)',
        py: 2.565,
        mt: 'auto',
        flexShrink: 0,
        boxShadow: '0 -4px 20px rgba(15, 23, 42, 0.3)',
        width: '100%'
      }}
    >
      <Container maxWidth="xl" sx={{ px: 3 }}>
        <Stack 
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 2, md: 0 }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ width: '100%' }}
        >
          {/* Left: Logo & Copyright */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)', 
              p: 1, 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0
            }}>
              <img 
                src={datafyreLogo} 
                alt="Data Fyre" 
                style={{ height: "24px", width: "auto" }}
              />
            </Box>
            <Stack spacing={0.2}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  color: 'white',
                  lineHeight: 1.2
                }}
              >
                © {currentYear} Data Fyre PVT LTD
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem',
                  opacity: 0.7,
                  lineHeight: 1.2
                }}
              >
                Powered by <Box component="span" sx={{ fontWeight: 600 }}>Data Fyre PVT LTD</Box>
              </Typography>
            </Stack>
          </Stack>

          {/* Center: Quick Links */}
          <Stack 
            direction="row" 
            spacing={3}
            sx={{ 
              order: { xs: 3, md: 2 },
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'flex-start', md: 'center' }
            }}
          >
            <Typography 
              variant="body2" 
              component="a"
              href="#"
              sx={{ 
                fontSize: '0.85rem',
                color: 'rgba(226, 232, 240, 0.8)',
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                '&:hover': { 
                  color: 'white'
                }
              }}
            >
              About
            </Typography>
            <Typography 
              variant="body2" 
              component="a"
              href="#"
              sx={{ 
                fontSize: '0.85rem',
                color: 'rgba(226, 232, 240, 0.8)',
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                '&:hover': { 
                  color: 'white'
                }
              }}
            >
              Privacy
            </Typography>
            <Typography 
              variant="body2" 
              component="a"
              href="#"
              sx={{ 
                fontSize: '0.85rem',
                color: 'rgba(226, 232, 240, 0.8)',
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                '&:hover': { 
                  color: 'white'
                }
              }}
            >
              Terms
            </Typography>
            <Typography 
              variant="body2" 
              component="a"
              href="#"
              sx={{ 
                fontSize: '0.85rem',
                color: 'rgba(226, 232, 240, 0.8)',
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                '&:hover': { 
                  color: 'white'
                }
              }}
            >
              Help
            </Typography>
          </Stack>

          {/* Right: Contact Info */}
          <Stack 
            spacing={0.5} 
            alignItems="flex-end"
            sx={{ 
              order: { xs: 2, md: 3 },
              width: { xs: '100%', md: 'auto' },
              alignItems: { xs: 'flex-start', md: 'flex-end' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email sx={{ fontSize: 16, color: '#60a5fa', flexShrink: 0 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem',
                  color: 'rgba(226, 232, 240, 0.9)'
                }}
              >
                support@zero2hire.com
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone sx={{ fontSize: 16, color: '#4ade80', flexShrink: 0 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Typography 
                  component="a" 
                  href="https://wa.me/18179662996" 
                  target="_blank"
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.85rem',
                    color: 'rgba(226, 232, 240, 0.9)',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    '&:hover': { 
                      color: '#4ade80'
                    } 
                  }}
                >
                  +1 817 966 2996
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.85rem',
                    color: 'rgba(148, 163, 184, 0.6)'
                  }}
                >
                  |
                </Typography>
                <Typography 
                  component="a" 
                  href="https://wa.me/19378562492" 
                  target="_blank"
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.85rem',
                    color: 'rgba(226, 232, 240, 0.9)',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    '&:hover': { 
                      color: '#4ade80'
                    } 
                  }}
                >
                  (937) 856-2492
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
