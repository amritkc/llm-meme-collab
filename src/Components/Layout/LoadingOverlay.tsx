import { Backdrop, CircularProgress, Stack, Typography } from "@mui/material";

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  subtitle?: string;
}

export default function LoadingOverlay({
  open,
  message = "Loading...",
  subtitle = "Please wait",
}: LoadingOverlayProps) {
  return (
    <Backdrop
      open={open}
      sx={{
        color: "#fff",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
      }}
    >
      <Stack spacing={3} alignItems="center">
        <CircularProgress color="inherit" size={60} thickness={4} />
        <Typography variant="h6" fontWeight={600}>
          {message}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {subtitle}
        </Typography>
      </Stack>
    </Backdrop>
  );
}
