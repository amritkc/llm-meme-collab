import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
  Snackbar,
  Alert,
  LinearProgress,
  Tooltip,
  Paper,
  Chip,
  Container,
  alpha,
  useTheme,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";

import { useSession } from "../../app/session/SessionContext";
import LoadingOverlay from "../../Components/Layout/LoadingOverlay";
import TemplateSelector, { type MemeTemplate } from "../../Components/Templates/TemplateSelector";
import CaptionIdeasForm from "../../Components/CaptionsIdeas/CaptionIdeasForm";
import MemeEditor, { type MemeTextLayer } from "../../Components/MemeEditor/MemeEditor";
import { exportMemePNG } from "../../Components/MemeEditor/exportMeme";
import { uploadMemeAndInsertRow } from "../../lib/memeUpload";

// Student Life templates
import successKid from "../../assets/templates/Success_Kid.jpg";
import theOfficeCongrats from "../../assets/templates/The_Office_Congratulations.jpg";
import thirdWorldKid from "../../assets/templates/Third_World_Skeptical_Kid.jpg";
import waitingSkeleton from "../../assets/templates/Waiting_Skeleton.jpg";

// Technology / AI templates
import absoluteCinema from "../../assets/templates/Absolute_Cinema.jpg";
import changeMind from "../../assets/templates/Change_My_Mind.jpg";
import oneDoesNotSimply from "../../assets/templates/One_Does_Not_Simply.jpg";
import surprisedPikachu from "../../assets/templates/Surprised_Pikachu.jpg";

// Daily Struggles templates
import disasterGirl from "../../assets/templates/Disaster_Girl.jpg";
import laughingLeo from "../../assets/templates/Laughing_Leo.jpg";
import youGuysGettingPaid from "../../assets/templates/You_Guys_Are_Getting_Paid.jpg";
import scientist from "../../assets/templates/You_know_Im_something_of_a_scientist_myself.jpg";

const TOPIC_SECONDS = 300;

const FALLBACK_TASKS: {
  topicId: string;
  title: string;
  description: string;
  templates: MemeTemplate[];
}[] = [
  {
    topicId: "student-life",
    title: "Student Life",
    description: "Create a meme about funny or relatable moments from your student experience - like exams, deadlines, or campus life.",
    templates: [
      { id: "sl1", title: "Success Kid", imageUrl: successKid },
      { id: "sl2", title: "Office Congratulations", imageUrl: theOfficeCongrats },
      { id: "sl3", title: "Third World Kid", imageUrl: thirdWorldKid },
      { id: "sl4", title: "Waiting Skeleton", imageUrl: waitingSkeleton },
    ],
  },
  {
    topicId: "technology-ai",
    title: "Technology / AI",
    description: "Make a meme about technology, artificial intelligence, coding, or tech-related situations that people can relate to.",
    templates: [
      { id: "ta1", title: "Absolute Cinema", imageUrl: absoluteCinema },
      { id: "ta2", title: "Change My Mind", imageUrl: changeMind },
      { id: "ta3", title: "One Does Not Simply", imageUrl: oneDoesNotSimply },
      { id: "ta4", title: "Surprised Pikachu", imageUrl: surprisedPikachu },
    ],
  },
  {
    topicId: "daily-struggles",
    title: "Daily Struggles",
    description: "Create a meme about common everyday challenges, frustrations, or relatable moments from daily life.",
    templates: [
      { id: "ds1", title: "Disaster Girl", imageUrl: disasterGirl },
      { id: "ds2", title: "Laughing Leo", imageUrl: laughingLeo },
      { id: "ds3", title: "Getting Paid", imageUrl: youGuysGettingPaid },
      { id: "ds4", title: "Scientist", imageUrl: scientist },
    ],
  },
];

type IdeaState = {
  layers: MemeTextLayer[];
};

type TopicState = {
  topicId: string;
  selectedTemplateId: string | null;

  ideas: [IdeaState, IdeaState, IdeaState];
  bestIdeaIndex: 0 | 1 | 2;

  memePng?: string;

  savedImageUrl?: string;
  savedImagePath?: string;
};

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TaskHumanFirst() {
  const session = useSession();
  const theme = useTheme();

  const participantId =
    (session as any).participantId ||
    (session as any).participant?.id ||
    (session as any).participant_id ||
    (session as any).userId ||
    "unknown";

  const tasks = useMemo(() => FALLBACK_TASKS, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeTask = tasks[activeIndex];

  const [saving, setSaving] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(TOPIC_SECONDS);
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    type: "success" | "error" | "info";
  }>({ open: false, msg: "", type: "info" });

  const [stateByTopic, setStateByTopic] = useState<TopicState[]>(
    tasks.map((t) => ({
      topicId: t.topicId,
      selectedTemplateId: null,
      ideas: [
        {
          layers: [
            {
              id: "caption",
              text: "",
              xPct: 10,
              yPct: 80,
              fontSize: 24,
              locked: true,
            } as any,
          ],
        },
        {
          layers: [
            {
              id: "caption",
              text: "",
              xPct: 10,
              yPct: 80,
              fontSize: 24,
              locked: true,
            } as any,
          ],
        },
        {
          layers: [
            {
              id: "caption",
              text: "",
              xPct: 10,
              yPct: 80,
              fontSize: 24,
              locked: true,
            } as any,
          ],
        },
      ],
      bestIdeaIndex: 0,
      memePng: undefined,
      savedImageUrl: undefined,
      savedImagePath: undefined,
    }))
  );

  const activeState = stateByTopic[activeIndex];

  const activeTemplates = activeTask.templates;
  const selectedTemplate =
    activeTemplates.find((t) => t.id === activeState.selectedTemplateId) ?? null;

  const getCaptionText = (idea: IdeaState) =>
    (idea.layers.find((l) => l.locked)?.text ?? "").trim();

  const canContinue = useMemo(() => {
    const templateOk = !!activeState.selectedTemplateId;
    const captions = activeState.ideas.map(getCaptionText);
    const ideasOk = captions.every((x) => x.length >= 3);
    return templateOk && ideasOk;
  }, [activeState.selectedTemplateId, activeState.ideas]);

  // Timer per topic
  useEffect(() => {
    setSecondsLeft(TOPIC_SECONDS);
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeIndex]);

  useEffect(() => {
    if (secondsLeft === 0) {
      setToast({
        open: true,
        type: "info",
        msg: "Time’s up for this topic. Please submit to continue.",
      });
    }
  }, [secondsLeft]);

  const updateActiveState = (patch: Partial<TopicState>) => {
    setStateByTopic((prev) =>
      prev.map((s, idx) => (idx === activeIndex ? { ...s, ...patch } : s))
    );
  };

  // No separate sync needed; caption text lives inside each idea's locked layer.

  const handleSelectTemplate = (templateId: string) => {
    updateActiveState({ selectedTemplateId: templateId });
  };

  const handleBestChange = (idx: 0 | 1 | 2) => {
    updateActiveState({ bestIdeaIndex: idx });
  };

  const handleEditorLayersChange = (layers: MemeTextLayer[]) => {
    const i = activeState.bestIdeaIndex;
    const nextIdeas = activeState.ideas.map((idea, idx) =>
      idx === i ? { ...idea, layers } : idea
    ) as [IdeaState, IdeaState, IdeaState];
    updateActiveState({ ideas: nextIdeas });
  };

  // Commented out unused function - may be needed for session state in future
  // const saveAllToSession = () => {
  //   const payload = stateByTopic.map((s) => {
  //     const captions = s.ideas.map(getCaptionText);
  //     return {
  //       participantId,
  //       topicId: s.topicId,
  //       templateId: s.selectedTemplateId,
  //       captions,
  //       bestIdeaIndex: s.bestIdeaIndex,
  //       bestCaption: captions[s.bestIdeaIndex] ?? "",
  //       layers: {
  //         bestLayers: s.ideas[s.bestIdeaIndex].layers,
  //         ideas: s.ideas.map((i) => i.layers),
  //       },
  //       memePng: s.memePng,
  //       savedImageUrl: s.savedImageUrl,
  //       savedImagePath: s.savedImagePath,
  //     };
  //   });
  //
  //   (session as any).setHumanFirstResults?.(payload);
  //   session.setCaptionIdeas?.(payload.flatMap((p: any) => p.captions));
  // };

  const goNext = async () => {
    if (saving) return;

    if (!canContinue) {
      setToast({
        open: true,
        type: "error",
        msg: "Select a template and write 3 captions (min 3 chars each).",
      });
      return;
    }

    if (!selectedTemplate || !activeState.selectedTemplateId) {
      setToast({ open: true, type: "error", msg: "Please select a template." });
      return;
    }

    setSaving(true);
    try {
      // Save all 3 ideas separately
      for (let ideaIndex = 0; ideaIndex < 3; ideaIndex++) {
        const idea = activeState.ideas[ideaIndex];
        const caption = getCaptionText(idea);
        
        // Generate meme for this idea
        const memePng = await exportMemePNG({
          imageUrl: selectedTemplate.imageUrl,
          layers: idea.layers,
          width: 1400,
        });

        // Upload to Supabase
        await uploadMemeAndInsertRow({
          bucket: "memes",
          table: "meme_human_submissions",
          participantId,
          prolificPid: session.prolificPid,
          studyId: session.studyId,
          sessionId: session.sessionId,
          task: "human",
          topicId: activeTask.topicId,
          templateId: activeState.selectedTemplateId,
          ideaIndex,
          caption,
          layers: idea.layers,
          memeDataUrl: memePng,
        });
      }

      setToast({ open: true, type: "success", msg: "All 3 ideas saved!" });

      const isLast = activeIndex === tasks.length - 1;
      if (!isLast) {
        setActiveIndex((i) => i + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Redirect to Prolific completion URL
      window.location.href = "https://app.prolific.com/submissions/complete?cc=C1QDK8F6";
    } catch (err: any) {
      console.error(err);
      setToast({
        open: true,
        type: "error",
        msg: err?.message ? `Save failed: ${err.message}` : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const goPrev = () => {
    if (activeIndex === 0) return;
    setActiveIndex((i) => i - 1);
  };

  const progressPct = Math.round(((TOPIC_SECONDS - secondsLeft) / TOPIC_SECONDS) * 100);
  const isLowTime = secondsLeft <= 10;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
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
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={800}>
            Human-first Meme Task
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95 }}>
            Topic {activeIndex + 1} of {tasks.length} • Pick template • Write 3 captions • Edit meme
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Participant: <b>{session.prolificPid || participantId}</b>
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={(activeIndex / tasks.length) * 100}
          sx={{
            mt: 2,
            height: 6,
            borderRadius: 3,
            bgcolor: alpha("#fff", 0.2),
            "& .MuiLinearProgress-bar": {
              bgcolor: "#fff",
            },
          }}
        />
      </Paper>

      {/* ✅ Fixed timer widget (top-right) */}
      <Tooltip
        arrow
        placement="left"
        title={
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>
              Topic timer
            </Typography>
            <Typography variant="body2">
              {formatMMSS(secondsLeft)} remaining (1 minute per topic)
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Progress: {progressPct}%
            </Typography>
          </Box>
        }
      >
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999,
            px: 1.5,
            py: 1,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 1,
            backdropFilter: "blur(8px)",
          }}
        >
          <Chip
            icon={<AccessTimeIcon />}
            label={formatMMSS(secondsLeft)}
            color={isLowTime ? "error" : "primary"}
            variant={isLowTime ? "filled" : "outlined"}
            sx={{ fontWeight: 800 }}
          />
          <Box sx={{ minWidth: 120 }}>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{ height: 8, borderRadius: 99 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
              Topic {activeIndex + 1}/{tasks.length}
            </Typography>
          </Box>
        </Paper>
      </Tooltip>

      <Stack spacing={3}>
        {/* Topic Card */}
        <Card
          elevation={3}
          sx={{
            borderRadius: 3,
            background: `linear-gradient(to right, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.05)})`,
          }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight={800}>
              {activeTask.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {activeTask.description}
            </Typography>
          </CardContent>
        </Card>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="stretch">
          <Card
            elevation={3}
            sx={{
              flex: 1,
              borderRadius: 3,
              background: alpha(theme.palette.background.paper, 1),
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <ImageIcon sx={{ color: "primary.main", fontSize: 24 }} />
                <Typography variant="h6" fontWeight={800}>
                  1) Choose a template
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {!selectedTemplate ? (
                <TemplateSelector
                  templates={activeTemplates}
                  selectedId={activeState.selectedTemplateId}
                  onSelect={handleSelectTemplate}
                />
              ) : (
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={800}>Image editor</Typography>
                    <Button variant="outlined" onClick={() => updateActiveState({ selectedTemplateId: null })}>
                      Change template
                    </Button>
                  </Stack>
                  
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.05),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      💡 <strong>Tip:</strong> You can drag the caption text to reposition it and resize it
                    </Typography>
                  </Paper>
                  
                  {/* Idea Selector */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                      Select idea to edit:
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                      {activeState.ideas.map((idea, idx) => {
                        const captionText = getCaptionText(idea);
                        const isSelected = activeState.bestIdeaIndex === idx;
                        return (
                          <Card
                            key={idx}
                            onClick={() => handleBestChange(idx as 0 | 1 | 2)}
                            elevation={isSelected ? 4 : 1}
                            sx={{
                              flex: 1,
                              cursor: 'pointer',
                              border: 2,
                              borderColor: isSelected ? 'primary.main' : 'transparent',
                              bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: 'primary.main',
                                transform: 'translateY(-4px)',
                                boxShadow: 4,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                          >
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Typography variant="caption" fontWeight={800} color="primary">
                                Idea {idx + 1}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 0.5,
                                  fontSize: '0.875rem',
                                  minHeight: 40,
                                  color: captionText ? 'text.primary' : 'text.disabled',
                                  fontStyle: captionText ? 'normal' : 'italic',
                                }}
                              >
                                {captionText || 'No caption yet...'}
                              </Typography>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Stack>
                  </Box>

                  <MemeEditor
                    imageUrl={selectedTemplate?.imageUrl ?? null}
                    layers={activeState.ideas[activeState.bestIdeaIndex].layers}
                    onLayersChange={handleEditorLayersChange}
                    maxWidth={760}
                    maxHeight={520}
                  />
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card
            elevation={3}
            sx={{
              flex: 1,
              borderRadius: 3,
              background: alpha(theme.palette.background.paper, 1),
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <EditIcon sx={{ color: "primary.main", fontSize: 24 }} />
                <Typography variant="h6" fontWeight={800}>
                  2) Write 3 caption ideas
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              
              {!selectedTemplate ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'left',
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    borderRadius: 2,
                    border: `2px dashed ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    📝 How to Create Your Meme
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), p: 1.5, borderRadius: 1, textAlign: 'center' }}>
                    ⏱️ You have 5 minutes to complete this topic
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                    <strong>Step 1:</strong> Select a meme template from the left panel that you think works best for <strong>{activeTask.title}</strong>
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                    <strong>Step 2:</strong> Write 3 different caption ideas here
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                    <strong>Step 3:</strong> Select one idea to customize with the editor (you can change the template later if needed)
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    <strong>Step 4:</strong> Click "Save & Next Topic" - all 3 ideas will be saved!
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
                    👈 Please select a template to get started
                  </Typography>
                </Box>
              ) : (
                <CaptionIdeasForm
                  ideas={activeState.ideas}
                  bestIdeaIndex={activeState.bestIdeaIndex}
                  onIdeaLayersChange={(idx, layers) => {
                    // Automatically switch to the idea being edited
                    handleBestChange(idx as 0 | 1 | 2);
                    const nextIdeas = activeState.ideas.map((idea, i) =>
                      i === idx ? { ...idea, layers } : idea
                    ) as [IdeaState, IdeaState, IdeaState];
                    updateActiveState({ ideas: nextIdeas });
                  }}
                  onBestChange={handleBestChange}
                  hideBestPicker
                />
              )}
            </CardContent>
          </Card>
        </Stack>

        {/* <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  3) Create the meme
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  After choosing a template, the editor appears above in Step 1.
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary">
              Use the editor in Step 1 to drag text, change sizes, and add boxes.
            </Typography>
          </CardContent>
        </Card> */}

        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 1),
          }}
        >
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              variant="outlined"
              size="large"
              onClick={goPrev}
              disabled={activeIndex === 0 || saving}
              sx={{ px: 4, borderRadius: 2 }}
            >
              Back
            </Button>

            <Button
              variant="contained"
              size="large"
              onClick={goNext}
              disabled={!canContinue || saving}
              sx={{
                px: 4,
                borderRadius: 2,
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              {saving
                ? "Saving..."
                : activeIndex === tasks.length - 1
                ? "Finish → Done"
                : "Save & Next Topic"}
            </Button>
          </Stack>
        </Paper>
      </Stack>

      <Snackbar
        open={toast.open}
        autoHideDuration={2600}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.type}
          variant="filled"
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        >
          {toast.msg}
        </Alert>
      </Snackbar>

      <LoadingOverlay
        open={saving}
        message="Saving your memes..."
        subtitle="Please wait while we upload all 3 ideas"
      />
    </Container>
  );
}
