import { NavLink, Outlet } from "react-router-dom";
import { AppBar, Box, Container, Stack, Toolbar, Typography } from "@mui/material";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  fontWeight: isActive ? 700 : 500,
  textDecoration: "none",
  color: "inherit",
});

export default function RootLayout() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar disableGutters>
          <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", gap: 2, py: { xs: 0.5, sm: 1 } }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mr: 2 }}>
              Meme Rater
            </Typography>
            <Stack direction="row" spacing={2} sx={{ a: { color: "inherit" } }}>
              <NavLink to="/" style={linkStyle} end>
                Home
              </NavLink>
              <NavLink to="/about" style={linkStyle}>
                About
              </NavLink>
              <NavLink to="/contact" style={linkStyle}>
                Contact
              </NavLink>
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, width: "100%", py: { xs: 2, sm: 3 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
