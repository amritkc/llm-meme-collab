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

const ConsentForm = () => {
  const [isAgreed1, setIsAgreed1] = useState(false);
  const [isAgreed2, setIsAgreed2] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setConsented, setCondition } = useSession();
  const theme = useTheme();

  const handleAgree = () => {
    setConsented(true);
    setCondition("ai-first");

    const queryString = searchParams.toString();
    navigate(`/review?${queryString}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
      {/* Header */}
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
        {/* Introduction */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Informed Consent of Participation
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              You are invited to participate in the online study <strong>LLMeme</strong>, initiated and
              conducted by Amrit Khadka, Kaivalya Vanguri, Lavanya Raghavendra Rao, and Sebastian Feldkamp
              at TU Darmstadt. Please note:
            </Typography>

            <Typography variant="body2" color="text.secondary" component="div">
              <ul>
                <li>Your participation is voluntary.</li>
                <li>The online study will take approximately 15 minutes.</li>
                <li>
                  We will record basic demographics (e.g., age and gender) and your subjective perception
                  of the system.
                </li>
                <li>
                  Study results may be published only in anonymized and aggregated form. Your identity
                  will not be disclosed.
                </li>
              </ul>
            </Typography>

            <Typography variant="body2" color="text.secondary">
              If you have any questions about the informed consent process or your rights as a research
              participant, please contact Amrit Khadka (amrit.khadka@stud.tu-darmstadt.de). You may take
              as much time as you need to review this information.
            </Typography>
          </CardContent>
        </Card>

        {/* Purpose */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Purpose and Goal of the Research
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This study investigates how large language models (LLMs) support creative tasks such as
              meme creation. The findings may be presented at scientific or professional venues and
              published in academic proceedings or journals.
            </Typography>
          </CardContent>
        </Card>

        {/* Participation & Compensation */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Participation and Compensation
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Participation is voluntary. Approximately 100 individuals will take part in this study.
              You will receive compensation at a rate of 13 EUR per hour. You may skip any question or
              withdraw at any time without penalty.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You may withdraw your consent at any time. Upon withdrawal, your data will be deleted or,
              if deletion is not technically feasible, anonymized in accordance with GDPR Art. 17.
            </Typography>
          </CardContent>
        </Card>

        {/* Procedure */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Procedure
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ol>
                <li>Create a set of memes using the study interface.</li>
                <li>Provide feedback on your experience.</li>
              </ol>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The full procedure will take approximately 15 minutes.
            </Typography>
          </CardContent>
        </Card>

        {/* Risks & Benefits */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Risks and Benefits
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This study poses no foreseeable risks beyond normal computer use. You may discontinue at
              any time. Your benefit includes compensation and contributing to research in human–AI
              interaction.
            </Typography>
          </CardContent>
        </Card>

        {/* Data Protection */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Data Protection and Confidentiality
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Personal data are processed in accordance with the General Data Protection Regulation
              (GDPR). The legal basis for processing is your consent (GDPR Art. 6(1)(a)).
            </Typography>

            <Typography variant="body2" color="text.secondary" component="div">
              <ul>
                <li>Right of access (GDPR Art. 15)</li>
                <li>Right to rectification (GDPR Art. 16)</li>
                <li>Right to erasure (GDPR Art. 17)</li>
                <li>Right to restriction of processing (GDPR Art. 18)</li>
                <li>Right to data portability (GDPR Art. 20)</li>
                <li>Right to withdraw consent at any time (GDPR Art. 7(3))</li>
              </ul>
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              We collect demographics and technical metadata necessary to conduct the study (e.g.,
              browser type and timestamps). Data are analyzed and published only in anonymized or
              aggregated form.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Non-anonymized data are stored securely for up to six months and are accessible only to
              the research team. Anonymized data may be retained longer for scientific purposes.
            </Typography>
          </CardContent>
        </Card>

        {/* Investigators */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Identification of Investigators
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ul>
                <li>Amrit Khadka — amrit.khadka@stud.tu-darmstadt.de</li>
                <li>Lavanya Raghavendra Rao — lavanya.rao@stud.tu-darmstadt.de</li>
                <li>Kaivalya Vanguri — kaivalya.vanguri@stud.tu-darmstadt.de</li>
                <li>Sebastian Feldkamp — sebastian.feldkamp@stud.tu-darmstadt.de</li>
              </ul>
            </Typography>
          </CardContent>
        </Card>

        {/* Consent */}
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
              Informed Consent and Agreement
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAgreed1}
                    onChange={(e) => setIsAgreed1(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    I have read and understood the information above and voluntarily agree to
                    participate in this study.
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAgreed2}
                    onChange={(e) => setIsAgreed2(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    I consent to my data being recorded and processed in accordance with the GDPR.
                  </Typography>
                }
              />

              {isAgreed1 && isAgreed2 && (
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Continue */}
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleAgree}
            disabled={!isAgreed1 || !isAgreed2}
            sx={{ py: 1.5, fontWeight: 700 }}
          >
            Agree and Continue
          </Button>
        </Paper>
      </Stack>
    </Container>
  );
};

export default ConsentForm;
