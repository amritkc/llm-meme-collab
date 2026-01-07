import { useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

export default function Done() {
  useEffect(() => {
    // Redirect to Prolific completion URL after a short delay
    const timer = setTimeout(() => {
      window.location.href = "https://app.prolific.com/submissions/complete?cc=C1QDK8F6";
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        gap: 3,
      }}
    >
      <Typography variant="h3" fontWeight={800}>
        Thank you!
      </Typography>
      <Typography variant="h6" color="text.secondary">
        You have completed the study.
      </Typography>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Redirecting to Prolific...
      </Typography>
    </Box>
  );
}
