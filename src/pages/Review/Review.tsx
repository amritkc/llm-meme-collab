import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useSession } from "../../app/session/SessionContext";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  LinearProgress,
  Paper,
  Chip,
  Avatar,
  Container,
  useTheme,
  alpha,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ShareIcon from "@mui/icons-material/Share";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RatingControl from "../../Components/Rating/RatingControl";

type SubmissionRow = {
  id: any;
  participant_id: string;
  topic_id?: string;
  template_id?: string;
  task?: string;
  idea_index?: number;
  caption?: string;
  layers?: any;
  image_url?: string;
  image_path?: string;
  created_at?: string;
};

export default function Review() {
  const nav = useNavigate();
  const theme = useTheme();
  const { participantId } = useSession();

  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    severity?: "success" | "error" | "info";
  }>({ open: false, msg: "", severity: "info" });

  const [humor, setHumor] = useState<number>(3);
  const [shareability, setShareability] = useState<number>(3);
  const [funny, setFunny] = useState<number>(3);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("meme_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setError(error.message);
        setSubmissions([]);
      } else {
        setSubmissions(data ?? []);
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // reset local ratings when index changes
    setHumor(3);
    setShareability(3);
    setFunny(3);
  }, [index]);

  const current = submissions[index];

  const progressPct = useMemo(() => {
    if (!submissions.length) return 0;
    return Math.round(((index + 1) / submissions.length) * 100);
  }, [index, submissions.length]);

  const marks = useMemo(
    () => [
      { value: 1, label: "1" },
      { value: 2, label: "2" },
      { value: 3, label: "3" },
      { value: 4, label: "4" },
      { value: 5, label: "5" },
    ],
    []
  );

  const handleSave = async () => {
    if (!current) return;

    if (![humor, shareability, funny].every((v) => typeof v === "number" && v >= 1 && v <= 5)) {
      setToast({ open: true, msg: "Please provide ratings 1–5 for all dimensions.", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        submission_id: current.id,
        submission_participant_id: current.participant_id ?? null,
        reviewer_participant_id: participantId,
        humor,
        shareability,
        funny,
        image_url: current.image_url ?? null,
        caption: current.caption ?? null,
        created_at: new Date().toISOString(),
      } as any;

      const { error: insertError } = await supabase.from("meme_reviews").insert([payload]);
      if (insertError) throw insertError;

      setToast({ open: true, msg: "Rating saved", severity: "success" });

      const next = index + 1;
      if (next < submissions.length) setIndex(next);
      else setToast({ open: true, msg: "All done — thank you!", severity: "success" });
    } catch (e: any) {
      console.error(e);
      setToast({ open: true, msg: e?.message ?? "Save failed", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
        py: { xs: 2, md: 4 }
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Modern Header with Gradient */}
          <Paper
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: "white",
              p: 3,
              borderRadius: 3,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: "40%",
                height: "100%",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "0 0 0 100%",
              }
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
              <Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "white", color: "primary.main", width: 56, height: 56 }}>
                    <ThumbUpIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      Meme Review
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                      Rate the creativity and humor of each meme
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <Chip 
                label={participantId || "unknown"} 
                sx={{ 
                  bgcolor: "rgba(255,255,255,0.2)", 
                  color: "white",
                  fontWeight: 700,
                  backdropFilter: "blur(10px)"
                }} 
              />
            </Stack>
            
            <Box sx={{ mt: 3, position: "relative", zIndex: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  Progress
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {submissions.length ? `${index + 1} of ${submissions.length}` : "0 of 0"}
                </Typography>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={progressPct} 
                sx={{ 
                  height: 10, 
                  borderRadius: 99,
                  bgcolor: "rgba(255,255,255,0.2)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "white",
                    borderRadius: 99
                  }
                }} 
              />
            </Box>
          </Paper>

          {/* Loading / Error / Empty States */}
          {loading && (
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
                  <CircularProgress size={60} thickness={4} />
                  <Typography variant="h6" sx={{ mt: 3 }} color="text.secondary">
                    Loading memes...
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {!loading && error && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              <Typography fontWeight={600}>{error}</Typography>
            </Alert>
          )}

          {!loading && !error && !current && (
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ py: 8, textAlign: "center" }}>
                <Avatar sx={{ width: 80, height: 80, mx: "auto", mb: 2, bgcolor: "success.light" }}>
                  <CheckCircleIcon sx={{ fontSize: 48 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  All Done!
                </Typography>
                <Typography color="text.secondary">
                  No more submissions to review. Thank you for your participation!
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Main Content - Modern Layout */}
          {!loading && !error && current && (
            <Stack direction={{ xs: "column", lg: "row" }} spacing={3} alignItems="stretch">
              {/* Left: Meme Display */}
              <Box sx={{ flex: 2 }}>
                <Card 
                  elevation={4}
                  sx={{ 
                    height: "100%",
                    borderRadius: 3,
                    overflow: "hidden",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 8,
                    }
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Chip 
                        label={`Meme #${index + 1}`} 
                        color="primary" 
                        sx={{ fontWeight: 700 }}
                      />
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          size="small"
                          label={current.task || "N/A"}
                          sx={{ 
                            bgcolor: current.task === "ai" ? "info.light" : "success.light",
                            color: "white",
                            fontWeight: 600
                          }}
                        />
                      </Stack>
                    </Stack>

                    <Box
                      sx={{
                        width: "100%",
                        aspectRatio: "1",
                        maxHeight: 600,
                        borderRadius: 2,
                        overflow: "hidden",
                        bgcolor: alpha(theme.palette.grey[100], 0.5),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `2px solid ${theme.palette.divider}`,
                        position: "relative",
                        boxShadow: `inset 0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                      }}
                    >
                      {saving && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: "rgba(255, 255, 255, 0.95)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <Stack spacing={2} alignItems="center">
                            <CircularProgress size={56} thickness={4} />
                            <Typography variant="h6" fontWeight={700} color="primary">
                              Loading next meme...
                            </Typography>
                          </Stack>
                        </Box>
                      )}
                      <CardMedia
                        component="img"
                        image={current.image_url ?? ""}
                        alt={current.caption ?? "meme"}
                        loading="lazy"
                        sx={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "contain",
                          opacity: saving ? 0.2 : 1,
                          transition: "opacity 0.3s ease",
                        }}
                      />
                    </Box>

                    <Paper 
                      elevation={0}
                      sx={{ 
                        mt: 3, 
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="overline" fontWeight={800} color="primary">
                          Caption
                        </Typography>
                      </Stack>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontStyle: current.caption ? "normal" : "italic",
                          color: current.caption ? "text.primary" : "text.disabled",
                          lineHeight: 1.6
                        }}
                      >
                        {current.caption || "(no caption)"}
                      </Typography>
                    </Paper>
                  </CardContent>
                </Card>
              </Box>

              {/* Right: Rating Panel */}
              <Box sx={{ flex: 1, minWidth: { xs: "100%", lg: 380 } }}>
                <Card
                  elevation={4}
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    position: { lg: "sticky" },
                    top: { lg: 24 },
                    background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom>
                      Rate This Meme
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Share your honest opinion on a scale of 1-5
                    </Typography>

                    <Stack spacing={3}>
                      {/* Humor Rating */}
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5, 
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.warning.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                          <ThumbUpIcon color="warning" fontSize="small" />
                          <Typography variant="subtitle2" fontWeight={700}>
                            Humor
                          </Typography>
                        </Stack>
                        <RatingControl label="" value={humor} onChange={setHumor} marks={marks} />
                      </Paper>

                      {/* Shareability Rating */}
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5, 
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.info.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                          <ShareIcon color="info" fontSize="small" />
                          <Typography variant="subtitle2" fontWeight={700}>
                            Shareability
                          </Typography>
                        </Stack>
                        <RatingControl label="" value={shareability} onChange={setShareability} marks={marks} />
                      </Paper>

                      {/* Funny Rating */}
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5, 
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                          <SentimentVerySatisfiedIcon color="success" fontSize="small" />
                          <Typography variant="subtitle2" fontWeight={700}>
                            Funny
                          </Typography>
                        </Stack>
                        <RatingControl label="" value={funny} onChange={setFunny} marks={marks} />
                      </Paper>

                      <Divider />

                      {/* Action Button */}
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleSave}
                        disabled={saving}
                        endIcon={<NavigateNextIcon />}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          fontSize: "1rem",
                          fontWeight: 700,
                          textTransform: "none",
                          boxShadow: 4,
                          "&:hover": {
                            boxShadow: 8,
                            transform: "translateY(-2px)",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        {saving ? "Saving…" : "Save & Continue"}
                      </Button>

                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        {index + 1} of {submissions.length} memes reviewed
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Stack>
          )}

          {/* Footer */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2 }}>
            <Button 
              startIcon={<ArrowBackIcon />} 
              variant="outlined" 
              onClick={() => nav(-1)}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => nav("/feedback")}
              sx={{ borderRadius: 2 }}
            >
              Continue to Feedback
            </Button>
          </Stack>
        </Stack>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          severity={toast.severity ?? "info"} 
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
