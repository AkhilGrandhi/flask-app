import { useNavigate } from "react-router-dom";
import { Container, Box, Typography, Button, Paper } from "@mui/material";
import { Home, ArrowBack } from "@mui/icons-material";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            width: "100%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white"
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "6rem", sm: "8rem" },
              fontWeight: 700,
              mb: 2,
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
            }}
          >
            404
          </Typography>
          <Typography
            variant="h4"
            sx={{ mb: 2, fontWeight: 600 }}
          >
            Page Not Found
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 4, opacity: 0.9 }}
          >
            The page you're looking for doesn't exist or has been moved.
          </Typography>
          
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{
                bgcolor: "white",
                color: "primary.main",
                fontWeight: 600,
                px: 3,
                "&:hover": {
                  bgcolor: "grey.100",
                  transform: "translateY(-2px)",
                  boxShadow: 4
                },
                transition: "all 0.3s"
              }}
            >
              Go Back
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Home />}
              onClick={() => navigate("/")}
              sx={{
                borderColor: "white",
                color: "white",
                fontWeight: 600,
                px: 3,
                "&:hover": {
                  borderColor: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  transform: "translateY(-2px)"
                },
                transition: "all 0.3s"
              }}
            >
              Home
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

