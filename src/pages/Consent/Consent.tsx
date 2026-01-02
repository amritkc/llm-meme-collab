import { useSession } from "../../app/session/SessionContext";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const ConsentForm = () => {
  const [isAgreed1, setIsAgreed1] = useState(false);
  const [isAgreed2, setIsAgreed2] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setConsented, setCondition } = useSession();
  const theme = useTheme();

  const handleAgree = () => {
    setConsented(true);
    
    // Get studyid from URL to determine condition
    const studyId = searchParams.get('studyid');
    const queryString = searchParams.toString();
    
    if (studyId) {
      const studyIdLower = studyId.toLowerCase();
      
      if (studyIdLower === 'aifirst') {
        setCondition("ai-first");
        navigate(`/intro/ai?${queryString}`);
      } else if (studyIdLower === 'humanfirst') {
        setCondition("human-first");
        navigate(`/intro/human?${queryString}`);
      } else {
        // Default random assignment
        const c = Math.random() < 0.5 ? "human-first" : "ai-first";
        setCondition(c);
        navigate(c === "human-first" ? `/intro/human?${queryString}` : `/intro/ai?${queryString}`);
      }
    } else {
      // Random assignment if no studyid in URL
      const c = Math.random() < 0.5 ? "human-first" : "ai-first";
      setCondition(c);
      navigate(c === "human-first" ? `/intro/human?${queryString}` : `/intro/ai?${queryString}`);
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
            <VerifiedUserIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Informed Consent
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Please read carefully before proceeding
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Stack spacing={3}>
        {/* Introduction Card */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body1" paragraph>
              You are invited to participate in an online research study titled
              <strong> "LLMeme"</strong>, conducted by Amrit Khadka, Kaivalya Vanguri, 
              Lavanya Raghavendra Rao, Sebastian Feldkamp and supervised by researchers 
              at TU Darmstadt.
            </Typography>
          </CardContent>
        </Card>

        {/* Purpose Card */}
        <Card
          elevation={3}
          sx={{
            borderRadius: 3,
            background: `linear-gradient(to right, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.05)})`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Purpose
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This study investigates how people interact with AI systems during
              creative tasks, specifically meme creation and evaluation.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Participants are randomly assigned to one of two conditions:
            </Typography>
            <Stack spacing={1} sx={{ pl: 2 }}>
              <Stack direction="row" spacing={1}>
                <CheckCircleIcon sx={{ fontSize: 20, color: "primary.main" }} />
                <Typography variant="body2">
                  <strong>Human-First:</strong> You provide your own input before seeing
                  AI-generated meme content.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <CheckCircleIcon sx={{ fontSize: 20, color: "secondary.main" }} />
                <Typography variant="body2">
                  <strong>AI-First:</strong> You first see AI-generated meme content
                  before providing your own input.
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Procedure Card */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Procedure
            </Typography>
            <Typography variant="body2" color="text.secondary">
              After providing consent, you will interact with a meme generation and
              rating interface and answer short follow-up questions. The study takes
              approximately <strong>15 minutes</strong>.
            </Typography>
          </CardContent>
        </Card>

        {/* Voluntary Participation Card */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Voluntary Participation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Participation is voluntary. You may withdraw from the study at any time without penalty. 
              Compensation is provided only for completed submissions, in accordance with Prolific’s payment guidelines.
            </Typography>
          </CardContent>
        </Card>

        {/* Risks & Benefits Card */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Risks & Benefits
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are no known risks beyond normal computer use. Benefits include
              monetary compensation and contributing to research on human–AI
              collaboration.
            </Typography>
          </CardContent>
        </Card>

        {/* Data Protection Card */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Data Protection
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The study complies with the EU General Data Protection Regulation (GDPR).
              We collect demographic information (e.g., age, gender), interaction data,
              and technical metadata (e.g., browser type).
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your data will be stored securely, processed only for research purposes,
              and published only in anonymized form. You may withdraw your consent at
              any time (GDPR Art. 21).
            </Typography>
          </CardContent>
        </Card>

        {/* Consent Checkboxes Card */}
        <Card
          elevation={4}
          sx={{
            borderRadius: 3,
            border: `2px solid ${theme.palette.primary.main}`,
            background: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Consent
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAgreed1}
                    onChange={(e) => setIsAgreed1(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I have read and understood the information above and agree to
                    participate in this study.
                  </Typography>
                }
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAgreed2}
                    onChange={(e) => setIsAgreed2(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I consent to my data being recorded and processed in accordance with
                    the GDPR.
                  </Typography>
                }
              />

              {(isAgreed1 && isAgreed2) && (
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    mt: 2,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "success.main",
                    },
                  }}
                />
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 1),
          }}
        >
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleAgree}
            disabled={!isAgreed1 || !isAgreed2}
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
            Agree and Continue
          </Button>
        </Paper>
      </Stack>
    </Container>
  );
};

export default ConsentForm;


