import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../app/session/SessionContext";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import SpeedIcon from "@mui/icons-material/Speed";
import PsychologyIcon from "@mui/icons-material/Psychology";
import CommentIcon from "@mui/icons-material/Comment";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

const FeedbackForm = () => {
  const navigate = useNavigate();
  const { participantId } = useSession();
  const theme = useTheme();

  const [enjoyment, setEnjoyment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [aiHelpfulness, setAiHelpfulness] = useState("");
  const [openFeedback, setOpenFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!enjoyment || !difficulty || !aiHelpfulness) return;

    try {
      setLoading(true);

      await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          enjoyment,
          difficulty,
          aiHelpfulness,
          openFeedback,
        }),
      });

      navigate("/thank-you");
    } catch (err) {
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
      {/* Header with gradient */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: "white",
          p: 3,
          mb: 3,
          borderRadius: 3,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FeedbackIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Post-Study Feedback
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Share your experience with us
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Introduction */}
      <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body1" paragraph>
            Thank you for participating in this study! Your feedback is invaluable for our research.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please take a moment to reflect on your experience and answer the following questions. 
            There are no right or wrong answers – we're interested in your honest opinions and impressions.
            Questions marked with * are required.
          </Typography>
        </CardContent>
      </Card>

      <Stack spacing={3}>
        {/* Question 1: Enjoyment */}
        <Card
          elevation={3}
          sx={{
            borderRadius: 3,
            background: `linear-gradient(to right, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.05)})`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <SentimentSatisfiedAltIcon sx={{ fontSize: 24, color: "success.main" }} />
              </Box>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  1. How enjoyable did you find the task? *
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Think about how fun and engaging the meme creation process was for you.
                </Typography>
                <FormControl fullWidth required>
                  <InputLabel id="enjoyment-label">Select your rating</InputLabel>
                  <Select
                    labelId="enjoyment-label"
                    value={enjoyment}
                    onChange={(e) => setEnjoyment(e.target.value)}
                    label="Select your rating"
                  >
                    <MenuItem value="1">1 – Not enjoyable at all</MenuItem>
                    <MenuItem value="2">2 – Slightly enjoyable</MenuItem>
                    <MenuItem value="3">3 – Neutral</MenuItem>
                    <MenuItem value="4">4 – Quite enjoyable</MenuItem>
                    <MenuItem value="5">5 – Very enjoyable</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Question 2: Difficulty */}
        <Card
          elevation={3}
          sx={{
            borderRadius: 3,
            background: `linear-gradient(to right, ${alpha(theme.palette.warning.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.05)})`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <SpeedIcon sx={{ fontSize: 24, color: "warning.main" }} />
              </Box>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  2. How difficult was the task? *
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Consider the effort and challenge involved in creating and selecting memes.
                </Typography>
                <FormControl fullWidth required>
                  <InputLabel id="difficulty-label">Select your rating</InputLabel>
                  <Select
                    labelId="difficulty-label"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    label="Select your rating"
                  >
                    <MenuItem value="1">1 – Very easy</MenuItem>
                    <MenuItem value="2">2 – Somewhat easy</MenuItem>
                    <MenuItem value="3">3 – Moderate</MenuItem>
                    <MenuItem value="4">4 – Somewhat difficult</MenuItem>
                    <MenuItem value="5">5 – Very difficult</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Question 3: AI Helpfulness */}
        <Card
          elevation={3}
          sx={{
            borderRadius: 3,
            background: `linear-gradient(to right, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.05)})`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <PsychologyIcon sx={{ fontSize: 24, color: "info.main" }} />
              </Box>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  3. To what extent did the AI influence or support your decisions? *
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Reflect on how much the AI-generated suggestions affected your creative choices, 
                  whether you saw them first or after creating your own ideas.
                </Typography>
                <FormControl fullWidth required>
                  <InputLabel id="ai-helpfulness-label">Select your rating</InputLabel>
                  <Select
                    labelId="ai-helpfulness-label"
                    value={aiHelpfulness}
                    onChange={(e) => setAiHelpfulness(e.target.value)}
                    label="Select your rating"
                  >
                    <MenuItem value="1">1 – Not at all</MenuItem>
                    <MenuItem value="2">2 – Slightly</MenuItem>
                    <MenuItem value="3">3 – Moderately</MenuItem>
                    <MenuItem value="4">4 – Considerably</MenuItem>
                    <MenuItem value="5">5 – Very strongly</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Question 4: Open Feedback */}
        <Card
          elevation={3}
          sx={{
            borderRadius: 3,
            background: `linear-gradient(to right, ${alpha(theme.palette.secondary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.05)})`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CommentIcon sx={{ fontSize: 24, color: "secondary.main" }} />
              </Box>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  4. Any additional comments or feedback?
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  We'd love to hear your thoughts! Share any observations about the AI system, 
                  the interface, your creative process, or suggestions for improvement. (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={openFeedback}
                  onChange={(e) => setOpenFeedback(e.target.value)}
                  placeholder="For example: What did you think about the AI suggestions? Was the interface intuitive? What would you change?"
                  variant="outlined"
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 1),
          }}
        >
          {(!enjoyment || !difficulty || !aiHelpfulness) && (
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
              Please answer all required questions (*) to submit your feedback
            </Typography>
          )}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={loading || !enjoyment || !difficulty || !aiHelpfulness}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
              boxShadow: 3,
              "&:hover": {
                boxShadow: 6,
              },
            }}
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </Paper>
      </Stack>
    </Container>
  );
};

export default FeedbackForm;
