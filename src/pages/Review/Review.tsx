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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ShareIcon from "@mui/icons-material/Share";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CloseIcon from "@mui/icons-material/Close";
import RatingControl from "../../Components/Rating/RatingControl";
import { type MemeTextLayer } from "../../Components/MemeEditor/MemeEditor";

const TOTAL_REVIEW_SECONDS = 900; // 15 minutes

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Template images
import successKid from "../../assets/templates/Success_Kid.jpg";
import theOfficeCongrats from "../../assets/templates/The_Office_Congratulations.jpg";
import thirdWorldKid from "../../assets/templates/Third_World_Skeptical_Kid.jpg";
import waitingSkeleton from "../../assets/templates/Waiting_Skeleton.jpg";
import absoluteCinema from "../../assets/templates/Absolute_Cinema.jpg";
import changeMind from "../../assets/templates/Change_My_Mind.jpg";
import oneDoesNotSimply from "../../assets/templates/One_Does_Not_Simply.jpg";
import surprisedPikachu from "../../assets/templates/Surprised_Pikachu.jpg";
import disasterGirl from "../../assets/templates/Disaster_Girl.jpg";
import laughingLeo from "../../assets/templates/Laughing_Leo.jpg";
import youGuysGettingPaid from "../../assets/templates/You_Guys_Are_Getting_Paid.jpg";
import scientist from "../../assets/templates/You_know_Im_something_of_a_scientist_myself.jpg";

// Template mapping
const TEMPLATE_MAP: Record<string, string> = {
  "Success_Kid.jpg": successKid,
  "The_Office_Congratulations.jpg": theOfficeCongrats,
  "Third_World_Skeptical_Kid.jpg": thirdWorldKid,
  "Waiting_Skeleton.jpg": waitingSkeleton,
  "Absolute_Cinema.jpg": absoluteCinema,
  "Change_My_Mind.jpg": changeMind,
  "One_Does_Not_Simply.jpg": oneDoesNotSimply,
  "Surprised_Pikachu.jpg": surprisedPikachu,
  "Disaster_Girl.jpg": disasterGirl,
  "Laughing_Leo.jpg": laughingLeo,
  "You_Guys_Are_Getting_Paid.jpg": youGuysGettingPaid,
  "You_know_Im_something_of_a_scientist_myself.jpg": scientist,
};

// Helper function to convert caption to layers if layers don't exist
function captionToLayers(text: string): MemeTextLayer[] {
  if (!text) return [];
  return [
    {
      id: "caption",
      text,
      xPct: 10,
      yPct: 80,
      fontSize: 24,
      locked: true,
    } as MemeTextLayer,
  ];
}

// Read-only meme viewer (no editing controls)
function MemeViewer({ imageUrl, layers }: { imageUrl: string; layers: MemeTextLayer[] }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <Box
        component="img"
        src={imageUrl}
        alt="meme"
        sx={{
          width: "100%",
          display: "block",
          objectFit: "contain",
        }}
      />

      {layers.map((layer) => {
        const visible = layer.text.trim().length > 0;
        if (!visible) return null;

        return (
          <Box
            key={layer.id}
            sx={{
              position: "absolute",
              left: `${layer.xPct}%`,
              top: `${layer.yPct}%`,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: "rgba(0,0,0,0.25)",
              maxWidth: "92%",
            }}
          >
            <Typography
              sx={{
                fontSize: layer.fontSize,
                fontWeight: 900,
                color: "white",
                textShadow: "0px 2px 6px rgba(0,0,0,0.85)",
                lineHeight: 1.05,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {layer.text}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

type SubmissionRow = {
  id: any;
  participant_id?: string;
  topic_id?: string;
  template_id?: string;
  template?: string;
  task?: string;
  idea_index?: number;
  caption?: string;
  layers?: any;
  image_url?: string;
  image_path?: string;
  variation_number?: number;
  created_at?: string;
};

/**
 * Get 10 unused review meme variations for a reviewer for a specific topic
 * Ultra-optimized: minimal database calls, batch operations
 */
async function getUnusedReviewVariations(
  reviewerParticipantId: string,
  topicId: string,
  count: number = 10
): Promise<number[]> {
  
  // Single parallel query to get all needed data
  const [existingAssignments, completedReviews, availableMemes] = await Promise.all([
    supabase
      .from("review_assignments")
      .select("variation_number")
      .eq("reviewer_participant_id", reviewerParticipantId)
      .eq("topic_id", topicId),
    supabase
      .from("meme_reviews")
      .select("variation_number")
      .eq("reviewer_participant_id", reviewerParticipantId)
      .eq("topic_id", topicId),
    supabase
      .from("review_memes")
      .select("variation_number")
      .eq("topic_id", topicId)
  ]);

  // Variations already reviewed (never reassign)
  const reviewedVariations = new Set(
    (completedReviews.data || []).map(r => r.variation_number).filter(v => v != null)
  );

  // Existing unreviewed assignments
  const existingUnreviewed = (existingAssignments.data || [])
    .map(a => a.variation_number)
    .filter(v => v != null && !reviewedVariations.has(v));

  if (existingUnreviewed.length >= count) {
    console.log(`✅ Using ${count} existing assignments for ${topicId}`);
    return existingUnreviewed.slice(0, count);
  }

  const assignedVariations = [...existingUnreviewed];
  const neededCount = count - assignedVariations.length;

  if (neededCount === 0) {
    return assignedVariations;
  }

  // Find new variations to assign
  const allVariations = (availableMemes.data || [])
    .map(m => m.variation_number)
    .filter(v => v != null);

  const unusedVariations = allVariations
    .filter(v => !reviewedVariations.has(v) && !assignedVariations.includes(v))
    .sort(() => Math.random() - 0.5)
    .slice(0, neededCount);

  if (unusedVariations.length === 0) {
    console.warn(`⚠️ No unused variations for ${topicId}`);
    return assignedVariations;
  }

  // Batch insert all new assignments at once
  const insertData = unusedVariations.map(variation => ({
    reviewer_participant_id: reviewerParticipantId,
    topic_id: topicId,
    variation_number: variation,
    assigned_at: new Date().toISOString(),
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("review_assignments")
    .insert(insertData)
    .select("variation_number");

  if (insertError) {
    console.error("Batch insert error:", insertError);
    // Fallback: try individual inserts for conflicts
    for (const variation of unusedVariations) {
      const { error } = await supabase
        .from("review_assignments")
        .insert({
          reviewer_participant_id: reviewerParticipantId,
          topic_id: topicId,
          variation_number: variation,
          assigned_at: new Date().toISOString(),
        });
      
      if (!error) {
        assignedVariations.push(variation);
        if (assignedVariations.length >= count) break;
      }
    }
  } else {
    const insertedVars = (inserted || []).map(i => i.variation_number);
    assignedVariations.push(...insertedVars);
  }

  console.log(`✅ Assigned ${assignedVariations.length}/${count} for ${topicId}`);
  return assignedVariations.slice(0, count);
}

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
  const [creativity, setCreativity] = useState<number>(3);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_REVIEW_SECONDS);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    let mounted = true;
    let isExecuting = false;
    
    async function loadUniqueReviewMemes() {
      // Prevent double execution (React Strict Mode in dev)
      if (isExecuting) return;
      isExecuting = true;
      
      setLoading(true);
      setError(null);

      try {
        // First, get actual topic_id values from the database
        const { data: topicsData, error: topicsError } = await supabase
          .from("review_memes")
          .select("topic_id");

        if (topicsError) {
          console.error("Error fetching topics:", topicsError);
          throw topicsError;
        }

        // Get unique topic_ids from database
        const topics = [...new Set(topicsData?.map(t => t.topic_id) || [])];
        console.log("📋 Found topics in database:", topics);

        console.log("📋 Assigning 10 memes per topic for review...");

        // Parallel: assign variations for all topics at once
        const assignmentPromises = topics.map(topicId => 
          getUnusedReviewVariations(participantId, topicId, 10)
        );

        const allVariationNumbers = await Promise.all(assignmentPromises);

        // Build fetch queries - batch by topic for efficiency
        const fetchPromises = topics.map((topicId, idx) => {
          const variations = allVariationNumbers[idx];
          if (variations.length === 0) return Promise.resolve([]);

          // Single query per topic using IN clause (much faster than 10 individual queries)
          return supabase
            .from("review_memes")
            .select("*")
            .eq("topic_id", topicId)
            .in("variation_number", variations)
            .then(({ data, error }) => {
              if (error) {
                console.error(`Error fetching memes for ${topicId}:`, error);
                return [];
              }
              return data || [];
            });
        });

        const memesByTopic = await Promise.all(fetchPromises);
        const assignedMemesData = memesByTopic.flat() as SubmissionRow[];

        if (!mounted) return;

        setSubmissions(assignedMemesData);
        setLoading(false);

        console.log(`🎯 Loaded ${assignedMemesData.length}/30 memes in total`);

      } catch (err: any) {
        console.error("Error loading review memes:", err);
        if (mounted) {
          setError(err.message || "Failed to load review memes");
          setSubmissions([]);
          setLoading(false);
        }
      }
    }

    loadUniqueReviewMemes();
    return () => {
      mounted = false;
    };
  }, [participantId]);

  useEffect(() => {
    // reset local ratings when index changes
    setHumor(3);
    setShareability(3);
    setCreativity(3);
  }, [index]);

  // Timer countdown
  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      setToast({
        open: true,
        msg: "Time's up! Please finish your current review.",
        severity: "info",
      });
    }
  }, [secondsLeft]);

  const current = submissions[index];

  const progressPct = useMemo(() => {
    if (!submissions.length) return 0;
    return Math.round(((index + 1) / submissions.length) * 100);
  }, [index, submissions.length]);

  const isLowTime = secondsLeft <= 60;

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

    if (![humor, shareability, creativity].every((v) => typeof v === "number" && v >= 1 && v <= 5)) {
      setToast({ open: true, msg: "Please provide ratings 1–5 for all dimensions.", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        submission_id: current.id,
        submission_participant_id: current.participant_id ?? null,
        reviewer_participant_id: participantId,
        topic_id: current.topic_id ?? null,
        template_id: current.template_id ?? null,
        variation_number: current.variation_number ?? null,
        task: current.task ?? null,
        humor,
        shareability,
        creativity,
        image_url: current.image_url ?? null,
        caption: current.caption ?? null,
        created_at: new Date().toISOString(),
      } as any;

      const { error: insertError } = await supabase.from("meme_reviews").insert([payload]);
      if (insertError) throw insertError;

      setToast({ open: true, msg: "Rating saved", severity: "success" });

      const next = index + 1;
      if (next < submissions.length) {
        setIndex(next);
      } else {
        setToast({ open: true, msg: "All done — thank you!", severity: "success" });
        // Navigate to done page (which redirects to Prolific) after a short delay
        setTimeout(() => nav("/done"), 1500);
      }
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
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip 
                  icon={<AccessTimeIcon />}
                  label={formatMMSS(secondsLeft)}
                  color={isLowTime ? "error" : "default"}
                  variant={isLowTime ? "filled" : "outlined"}
                  sx={{ 
                    bgcolor: isLowTime ? "error.main" : "rgba(255,255,255,0.2)", 
                    color: "white",
                    fontWeight: 700,
                    backdropFilter: "blur(10px)",
                    borderColor: "rgba(255,255,255,0.4)",
                    "& .MuiChip-icon": { color: "white" }
                  }} 
                />
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

          {/* Instructions Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setShowInstructions(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              How to Review Memes
            </Button>
          </Box>

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
                          label={current.topic_id || "N/A"}
                          color="secondary"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
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
                      {(() => {
                        // If we have the generated meme image, show it directly
                        if (current.image_url) {
                          return (
                            <CardMedia
                              component="img"
                              image={current.image_url}
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
                          );
                        }
                        
                        // Fallback: Use template with text overlay
                        const templateImage = current.template ? TEMPLATE_MAP[current.template] : null;
                        
                        if (templateImage) {
                          // Parse layers or create from caption
                          let layers: MemeTextLayer[] = [];
                          try {
                            layers = current.layers ? 
                              (Array.isArray(current.layers) ? current.layers : JSON.parse(current.layers)) 
                              : captionToLayers(current.caption || "");
                          } catch (e) {
                            layers = captionToLayers(current.caption || "");
                          }
                          
                          return (
                            <Box sx={{ 
                              width: "100%", 
                              height: "100%", 
                              opacity: saving ? 0.2 : 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}>
                              <MemeViewer
                                imageUrl={templateImage}
                                layers={layers}
                              />
                            </Box>
                          );
                        }
                        
                        // Last resort: no image available
                        return (
                          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
                            No image available
                          </Typography>
                        );
                      })()}
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

                      {/* Creativity Rating */}
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
                          <AutoAwesomeIcon color="success" fontSize="small" />
                          <Typography variant="subtitle2" fontWeight={700}>
                            Creativity
                          </Typography>
                        </Stack>
                        <RatingControl label="" value={creativity} onChange={setCreativity} marks={marks} />
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
            {/* <Button 
              startIcon={<ArrowBackIcon />} 
              variant="outlined" 
              onClick={() => nav(-1)}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button> */}
            {/* <Button 
              variant="outlined" 
              onClick={() => nav("/feedback")}
              sx={{ borderRadius: 2 }}
            >
              Continue to Feedback
            </Button> */}
          </Stack>
        </Stack>
      </Container>

      {/* Instructions Dialog Popup */}
      <Dialog
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'white',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <HelpOutlineIcon color="primary" fontSize="large" />
              <Typography variant="h5" fontWeight={700}>
                How to Review Memes
              </Typography>
            </Stack>
            <IconButton onClick={() => setShowInstructions(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 2,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <Typography variant="body1" fontWeight={700} color="primary.main" textAlign="center">
              ⏱️ You have 15 minutes to review all 30 memes
            </Typography>
          </Paper>
          
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="body1" fontWeight={700} color="text.primary" gutterBottom>
                Step 1: Look at each meme
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Carefully observe the meme image and read its caption
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" fontWeight={700} color="text.primary" gutterBottom>
                Step 2: Rate on three dimensions (1-5 scale)
              </Typography>
              <Stack spacing={1} sx={{ pl: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ThumbUpIcon fontSize="small" color="warning" />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Humor:</strong> How funny is this meme?
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ShareIcon fontSize="small" color="info" />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Shareability:</strong> Would you share this with friends?
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoAwesomeIcon fontSize="small" color="success" />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Creativity:</strong> How original and creative is this meme?
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            <Box>
              <Typography variant="body1" fontWeight={700} color="text.primary" gutterBottom>
                Step 3: Save and continue
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Save & Continue" to move to the next meme
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                mt: 2,
                bgcolor: alpha(theme.palette.success.main, 0.08),
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                💡 Please provide honest ratings - there are no right or wrong answers!
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setShowInstructions(false)}
            variant="contained"
            fullWidth
            sx={{ borderRadius: 2, py: 1.5, fontWeight: 700, textTransform: 'none' }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>

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
