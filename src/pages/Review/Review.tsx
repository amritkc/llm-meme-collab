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
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RatingControl from "../../Components/Rating/RatingControl";

type SubmissionRow = {
  id: any;
  participant_id: string;
  topic_id?: string;
  template_id?: string;
  ideas?: string[];
  best_caption?: string;
  image_url?: string;
  image_path?: string;
  created_at?: string;
};

export default function Review() {
  const nav = useNavigate();
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
        caption: current.best_caption ?? null,
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
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Stack spacing={2}>
        {/* Header */}
        <Stack spacing={1}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Meme Review
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Reviewer: <b>{participantId || "unknown"}</b>
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {submissions.length ? `${index + 1} / ${submissions.length}` : "0 / 0"}
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progressPct} sx={{ height: 8, borderRadius: 99 }} />
        </Stack>

        {/* Loading / Error / Empty */}
        {loading && (
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            </CardContent>
          </Card>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && !current && <Alert severity="info">No submissions found.</Alert>}

        {/* Main layout */}
        {!loading && !error && current && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
            {/* Left: Meme */}
            <Box sx={{ flex: 2, minWidth: 0 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                    Meme
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box
                    sx={{
                      width: "100%",
                      aspectRatio: { xs: "4 / 3", sm: "16 / 10" },
                      maxHeight: { xs: 420, md: 640 },
                      borderRadius: 1,
                      overflow: "hidden",
                      bgcolor: "grey.50",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={current.image_url ?? ""}
                      alt={current.best_caption ?? "meme"}
                      loading="lazy"
                      sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  </Box>

                  <Stack sx={{ mt: 2 }} spacing={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Caption
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {current.best_caption ?? "(no caption)"}
                      </Typography>
                    </Paper>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {/* Right: Ratings */}
            <Box sx={{ flex: 1, minWidth: 320 }}>
              <Card
                sx={{
                  height: "100%",
                  position: { md: "sticky" },
                  top: { md: 96 },
                }}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Rate this meme
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />

                  {/* Match screenshot: plain rows + dividers (no mini-cards) */}
                  <Stack spacing={1.75}>
                    <RatingControl label="Humor" value={humor} onChange={setHumor} marks={marks} />
                    <Divider />
                    <RatingControl label="Shareability" value={shareability} onChange={setShareability} marks={marks} />
                    <Divider />
                    <RatingControl label="Funny" value={funny} onChange={setFunny} marks={marks} />

                    <Box sx={{ pt: 1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Button
                          variant="contained"
                          onClick={handleSave}
                          disabled={saving}
                          endIcon={<NavigateNextIcon />}
                          sx={{
                            px: 2.5,
                            py: 1.2,
                            borderRadius: 1,
                            minWidth: 220,
                          }}
                        >
                          {saving ? "Saving…" : "Save rating & next"}
                        </Button>

                        <Typography variant="caption" color="text.secondary">
                          {index + 1} / {submissions.length}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        )}

        {/* Footer */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button startIcon={<ArrowBackIcon />} variant="text" onClick={() => nav(-1)}>
            Back
          </Button>
          <Button variant="outlined" size="small" onClick={() => nav("/feedback")}>
            Continue
          </Button>
        </Stack>
      </Stack>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      >
        <Alert severity={toast.severity ?? "info"} onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
