import { Component } from "react";
import { Container, Box, Typography, Button, Paper } from "@mui/material";
import { Refresh, Home } from "@mui/icons-material";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              py: 4
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 6,
                borderRadius: 3,
                width: "100%",
                textAlign: "center"
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: "error.main"
                }}
              >
                Oops! Something went wrong
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4 }}
              >
                We're sorry for the inconvenience. An unexpected error has occurred.
              </Typography>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <Box
                  sx={{
                    mb: 4,
                    p: 2,
                    bgcolor: "grey.100",
                    borderRadius: 2,
                    textAlign: "left",
                    overflow: "auto",
                    maxHeight: 300
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1, color: "error.main" }}
                  >
                    Error Details (Development Only):
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{ fontSize: "0.75rem", whiteSpace: "pre-wrap" }}
                  >
                    {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{ fontSize: "0.7rem", mt: 2, whiteSpace: "pre-wrap", color: "text.secondary" }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Refresh />}
                  onClick={this.handleRefresh}
                  sx={{ fontWeight: 600 }}
                >
                  Refresh Page
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                  sx={{ fontWeight: 600 }}
                >
                  Go to Home
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

