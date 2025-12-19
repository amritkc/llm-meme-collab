import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#fafafa",
      paper: "#fff",
    },
  },
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: "lg",
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          paddingTop: 16,
          paddingBottom: 10,
        },
        thumb: {
          height: 20,
          width: 20,
        },
        track: {
          height: 6,
        },
        rail: {
          height: 6,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },
});

export default theme;
