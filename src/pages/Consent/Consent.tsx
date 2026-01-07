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
    setCondition("human-first");
    
    // Get query parameters and preserve them
    const queryString = searchParams.toString();
    
    // Navigate directly to TaskHumanFirst
    navigate(`/task/human-first?${queryString}`);
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
              You are invited to participate in an online research study of an
              <strong> "LLMeme Rater"</strong>, conducted by Amrit Khadka, Kaivalya Vanguri, 
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
              <p>Your participation is voluntary.</p>
              <p>The online study will last approximately 15 minutes.</p>
              <p>We will record personal demographics (age, gender, etc.) as well as your subjective perception of the system.</p>
              <p>We may publish our results from this and other sessions, but all such reports will be confidential and will neither include your name nor cannot be associated with your identity.</p>
              <p>If you have any questions about the whole informed consent process of this research or your rights as a human research subject, please contact us. You should carefully read the settings below. (You may take as much time as you need to read the consent form.)</p>
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Procedure
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <p>After giving consent, you will be guided through the following steps:</p>
              <ol>
                <li>Participants generate a set of Memes</li>
                <li>Participants provide feedback about the process</li>
              </ol>
              <p>The complete procedure of this online study will last approximately 15 minutes.</p>
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
              Data Protection and Confidentiality
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <p>The General Data Protection Regulation (GDPR) of the European Union (EU) governs that data collection process. The legal basis for processing the personal data is the consent in accordance with GDPR Art. 6 (1). The GDPR agreneets a set of right to the data subjects, including the right to access, rectification, and erasure of personal data.</p>
          <ul>
            <li>You have the right to access your personal data at any time (GDPR Art. 15).</li>
            <li>You have the right to correct inaccurate personal data at any time (GDPR Art. 16).</li>
            <li>You have the right to have your personal data deleted (GDPR Art. 17).</li>
            <li>You have the right to limit the processing of your personal data (GDPR Art. 18).</li>
            <li>You have the right to have your data transforared to others (GDPR Art. 20).</li>
            <li>You have the right to withdraw the consent given (GDPR Art. 21).</li>
            <li>If you wish to exercise any of your rights, please contact the researchers.</li>
          </ul>  
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <p>Personal data (age, gender, experience with creative tasks) will be recorded during participation. The contact details of the study participants can be used to track potential infection chains. Researchers will not identify you by your real name in any reports using settings obtained from this online study, and your confidentiality as a participant in this online study will remain secure. Data collected in this online study will be treated in compliance with the GDPR.</p>
          <p>We will record demographics and browser meta data during the online study. All data you provide in this online study will be published anonymized. Subsequent uses of records and data will be subject to standard data use policies that protect the participating individuals' anonymity. We will remove or code any personal information that could identify you before publishing the data to ensure that no one can identify you from the information we share. We will use current scientific standards and known methods for anonymization. When your data are anonymized, they are altered in a manner that they can no longer be traced back to your person or only with disproportionate technical effort. Despite these measures, we cannot guarantee the anonymity of your personal data. This site uses cookies and other tracking technologies to conduct the research, to improve the user experience, the ability to interact with the system and to provide additional content from third parties. Despite careful control of content, the researchers assume no liability for damages, which directly or indirectly result from the use of this online application.</p>
          <p>Your non-anonymized data will be stored for six months from the time your consent is given, unless you withdraw your consent before this period has elapsed. Your non-anonymized data will be stored in a secure location and will be accessible only to the researchers involved in this work.</p>
          <p>Anonymized data collected can be shared publicly. Data collected that have not been made public will be deleted after the end of the research.</p>
          <p>As with any publication or online-related activity, the risk of a breach of confidentiality is always possible. According to the GDPR, the researchers will inform the participant if a breach of confidential data is detected.</p>
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


