import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { useSession } from "../../app/session/SessionContext";
import LoadingOverlay from "../../Components/Layout/LoadingOverlay";
import { type MemeTemplate } from "../../Components/Templates/TemplateSelector";
import MemeEditor, { type MemeTextLayer } from "../../Components/MemeEditor/MemeEditor";
import { exportMemePNG } from "../../Components/MemeEditor/exportMeme";
import { uploadMemeAndInsertRow } from "../../lib/memeUpload";
import { supabase } from "../../lib/supabaseClient";

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

type AIMemeData = {
  id: number;
  topic: string;
  template: string;
  image_url: string;
  caption1: string;
  caption2: string;
  caption3: string;
  model: string;
  bucket: string;
  created_at: string;
  pk: string;
};

type IdeaState = {
  caption: string;
  layers: MemeTextLayer[];
};

type TopicState = {
  topicId: string;
  selectedTemplateId: string | null;
  aiMemeData: AIMemeData | null;
  ideas: [IdeaState, IdeaState, IdeaState];
  bestIdeaIndex: 0 | 1 | 2;
  loading: boolean;
};

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function captionToLayers(text: string): MemeTextLayer[] {
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

export default function TaskAIFirst() {
  const nav = useNavigate();
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
  const [hasEdited, setHasEdited] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(true);

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
      aiMemeData: null,
      ideas: [
        { caption: "", layers: captionToLayers("") },
        { caption: "", layers: captionToLayers("") },
        { caption: "", layers: captionToLayers("") },
      ],
      bestIdeaIndex: 0,
      loading: false,
    }))
  );

  const activeState = stateByTopic[activeIndex];

  // Fetch AI meme data from Supabase when topic loads
  useEffect(() => {
    const fetchAIMemes = async () => {
      const topicTitle = activeTask.title;
      
      updateActiveState({ loading: true });
      
      try {
        const { data, error } = await supabase
          .from("aimemes")
          .select("*")
          .eq("topic", topicTitle)
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          const aiMeme = data as AIMemeData;
          
          // Get template ID from local templates
          const localImageUrl = TEMPLATE_MAP[aiMeme.template];
          const template = activeTask.templates.find(t => t.imageUrl === localImageUrl);
          
          const ideas: [IdeaState, IdeaState, IdeaState] = [
            {
              caption: aiMeme.caption1,
              layers: captionToLayers(aiMeme.caption1),
            },
            {
              caption: aiMeme.caption2,
              layers: captionToLayers(aiMeme.caption2),
            },
            {
              caption: aiMeme.caption3,
              layers: captionToLayers(aiMeme.caption3),
            },
          ];

          updateActiveState({
            aiMemeData: aiMeme,
            selectedTemplateId: template?.id || null,
            ideas,
            loading: false,
          });
        }
      } catch (err) {
        console.error("Error fetching AI memes:", err);
        setToast({
          open: true,
          type: "error",
          msg: "Failed to load AI-generated memes",
        });
        updateActiveState({ loading: false });
      }
    };

    fetchAIMemes();
  }, [activeIndex]);

  const activeTemplates = activeTask.templates;
  const selectedTemplate =
    activeTemplates.find((t) => t.id === activeState.selectedTemplateId) ?? null;

  const canContinue = useMemo(() => {
    return !!activeState.selectedTemplateId && !activeState.loading;
  }, [activeState.selectedTemplateId, activeState.loading]);

  // Timer per topic
  useEffect(() => {
    setSecondsLeft(TOPIC_SECONDS);
    setHasEdited(false);
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
        msg: "Time's up for this topic. Please submit to continue.",
      });
    }
  }, [secondsLeft]);

  const updateActiveState = (patch: Partial<TopicState>) => {
    setStateByTopic((prev) =>
      prev.map((s, idx) => (idx === activeIndex ? { ...s, ...patch } : s))
    );
  };

  const handleBestChange = (idx: 0 | 1 | 2) => {
    updateActiveState({ bestIdeaIndex: idx });
  };

  const handleEditorLayersChange = (layers: MemeTextLayer[]) => {
    setHasEdited(true);
    const i = activeState.bestIdeaIndex;
    const nextIdeas = activeState.ideas.map((idea, idx) =>
      idx === i ? { ...idea, layers } : idea
    ) as [IdeaState, IdeaState, IdeaState];
    updateActiveState({ ideas: nextIdeas });
  };

  const handleCaptionChange = (idx: number, newCaption: string) => {
    setHasEdited(true);
    const nextIdeas = activeState.ideas.map((idea, i) =>
      i === idx ? { ...idea, caption: newCaption, layers: captionToLayers(newCaption) } : idea
    ) as [IdeaState, IdeaState, IdeaState];
    updateActiveState({ ideas: nextIdeas });
  };

  const goNext = async () => {
    if (saving) return;

    if (!canContinue) {
      setToast({
        open: true,
        type: "error",
        msg: "Please wait for AI memes to load.",
      });
      return;
    }

    if (!selectedTemplate || !activeState.selectedTemplateId) {
      setToast({ open: true, type: "error", msg: "No template selected." });
      return;
    }

    // Check if user has made any edits
    if (!hasEdited) {
      setShowConfirmDialog(true);
      return;
    }

    await saveAndContinue();
  };

  const saveAndContinue = async () => {

    setSaving(true);
    try {
      // Save all 3 AI ideas separately
      for (let ideaIndex = 0; ideaIndex < 3; ideaIndex++) {
        const idea = activeState.ideas[ideaIndex];
        
        // Generate meme for this idea
        const memePng = await exportMemePNG({
          imageUrl: selectedTemplate.imageUrl,
          layers: idea.layers,
          width: 1400,
        });

        // Upload to Supabase
        await uploadMemeAndInsertRow({
          bucket: "memes",
          table: "meme_ai_submissions",
          participantId,
          prolificPid: session.prolificPid,
          studyId: session.studyId,
          sessionId: session.sessionId,
          task: "ai",
          topicId: activeTask.topicId,
          templateId: activeState.selectedTemplateId,
          ideaIndex,
          caption: idea.caption,
          layers: idea.layers,
          memeDataUrl: memePng,
        });
      }

      setToast({ open: true, type: "success", msg: "All 3 AI ideas saved!" });

      const isLast = activeIndex === tasks.length - 1;
      if (!isLast) {
        setActiveIndex((i) => i + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      nav("/done");
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

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    await saveAndContinue();
  };

  const handleCancelSave = () => {
    setShowConfirmDialog(false);
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
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: "white",
          p: 3,
          mb: 3,
          borderRadius: 3,
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeIcon />
              <Typography variant="h4" fontWeight={800}>
                AI-first Meme Task
              </Typography>
            </Stack>
            <Button
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setShowHelpDialog(true)}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: alpha('#fff', 0.1),
                },
              }}
            >
              How it works
            </Button>
          </Stack>
          <Typography variant="body1" sx={{ opacity: 0.95 }}>
            Topic {activeIndex + 1} of {tasks.length} • Review AI suggestions • Edit and customize
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

      {/* Fixed timer widget (top-right) */}
      <Tooltip
        arrow
        placement="left"
        title={
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>
              Topic timer
            </Typography>
            <Typography variant="body2">
              {formatMMSS(secondsLeft)} remaining (5 minutes per topic)
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
            color={isLowTime ? "error" : "secondary"}
            variant={isLowTime ? "filled" : "outlined"}
            sx={{ fontWeight: 800 }}
          />
          <Box sx={{ minWidth: 120 }}>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              color="secondary"
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
            background: `linear-gradient(to right, ${alpha(theme.palette.secondary.main, 0.05)}, ${alpha(theme.palette.info.main, 0.05)})`,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeIcon color="secondary" />
              <Typography variant="h6" fontWeight={800}>
                {activeTask.title}
              </Typography>
            </Stack>
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
                <ImageIcon sx={{ color: "secondary.main", fontSize: 24 }} />
                <Typography variant="h6" fontWeight={800}>
                  AI-Selected Template & Editor
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              
              {activeState.loading ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <LinearProgress color="secondary" sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading AI-generated memes...
                  </Typography>
                </Box>
              ) : !selectedTemplate ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: "left",
                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    borderRadius: 2,
                    border: `2px dashed ${alpha(theme.palette.secondary.main, 0.3)}`,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    📝 How This Works
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="secondary.main" sx={{ mb: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), p: 1.5, borderRadius: 1, textAlign: 'center' }}>
                    ⏱️ You have 5 minutes to review this topic
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                    <strong>Step 1:</strong> AI has already selected the best template for <strong>{activeTask.title}</strong>
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                    <strong>Step 2:</strong> Review the 3 AI-generated caption ideas on the right
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                    <strong>Step 3:</strong> You task is to Edit any caption you want to improve 
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                    <strong>Step 4:</strong> Select an idea to customize with the editor
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    <strong>Step 5:</strong> Click "Save & Next Topic" - all 3 ideas will be saved!
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
                    ⏳ Waiting for AI memes to load...
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <Chip
                      icon={<AutoAwesomeIcon />}
                      label="AI-Selected Template"
                      color="secondary"
                      variant="outlined"
                    />
                  </Stack>
                  
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.secondary.main, 0.05),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      💡 <strong>Tip:</strong> You can drag the caption text to reposition it, resize it, and edit the AI-generated text directly in the editor!
                    </Typography>
                  </Paper>
                  
                  {/* Idea Selector */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                      Select idea to edit:
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                      {activeState.ideas.map((idea, idx) => {
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
                              borderColor: isSelected ? 'secondary.main' : 'transparent',
                              bgcolor: isSelected ? alpha(theme.palette.secondary.main, 0.08) : 'background.paper',
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: 'secondary.main',
                                transform: 'translateY(-4px)',
                                boxShadow: 4,
                                bgcolor: alpha(theme.palette.secondary.main, 0.05),
                              },
                            }}
                          >
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Typography variant="caption" fontWeight={800} color="secondary">
                                Idea {idx + 1}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 0.5,
                                  fontSize: '0.875rem',
                                  minHeight: 40,
                                  color: idea.caption ? 'text.primary' : 'text.disabled',
                                  fontStyle: idea.caption ? 'normal' : 'italic',
                                }}
                              >
                                {idea.caption || 'No caption...'}
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
                <EditIcon sx={{ color: "secondary.main", fontSize: 24 }} />
                <Typography variant="h6" fontWeight={800}>
                  AI-Generated Captions
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              
              {activeState.loading ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <LinearProgress color="secondary" sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading AI captions...
                  </Typography>
                </Box>
              ) : !selectedTemplate ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'left',
                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    borderRadius: 2,
                    border: `2px dashed ${alpha(theme.palette.secondary.main, 0.3)}`,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    📝 How This Works
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="secondary.main" sx={{ mb: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), p: 1.5, borderRadius: 1, textAlign: 'center' }}>
                    ⏱️ You have 5 minutes to review this topic
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                    <strong>Step 1:</strong> AI has already selected the best template for <strong>{activeTask.title}</strong>
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                    <strong>Step 2:</strong> Review the 3 AI-generated caption ideas
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                    <strong>Step 3:</strong> Select one idea to customize with the editor
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    <strong>Step 4:</strong> Click "Save & Next Topic" - all 3 ideas will be saved!
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
                    ⏳ Waiting for AI memes to load...
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {activeState.ideas.map((idea, idx) => (
                    <Card
                      key={idx}
                      elevation={activeState.bestIdeaIndex === idx ? 3 : 1}
                      sx={{
                        border: 2,
                        borderColor: activeState.bestIdeaIndex === idx ? 'secondary.main' : 'transparent',
                        bgcolor: activeState.bestIdeaIndex === idx ? alpha(theme.palette.secondary.main, 0.05) : 'background.paper',
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <AutoAwesomeIcon sx={{ fontSize: 16, color: "secondary.main" }} />
                          <Typography variant="caption" fontWeight={800} color="secondary">
                            AI Caption {idx + 1}
                          </Typography>
                        </Stack>
                        <Box
                          component="textarea"
                          value={idea.caption}
                          onChange={(e) => handleCaptionChange(idx, e.target.value)}
                          onFocus={() => handleBestChange(idx as 0 | 1 | 2)}
                          sx={{
                            width: '100%',
                            minHeight: 80,
                            p: 1.5,
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            resize: 'vertical',
                            '&:focus': {
                              outline: 'none',
                              borderColor: 'secondary.main',
                              boxShadow: `0 0 0 2px ${alpha(theme.palette.secondary.main, 0.1)}`,
                            },
                          }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>

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
              color="secondary"
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

      <Dialog
        open={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoAwesomeIcon color="secondary" />
            <Typography variant="h6" fontWeight={800}>
              How AI-First Meme Creation Works
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={600} color="secondary.main" sx={{ mb: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), p: 1.5, borderRadius: 1, textAlign: 'center' }}>
            ⏱️ You have 5 minutes to review each topic
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="secondary" gutterBottom>
                Step 1: AI Template Selection
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI has already analyzed the topic "<strong>{activeTask.title}</strong>" and selected the best meme template for you.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="secondary" gutterBottom>
                Step 2: Review AI Captions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                On the right side, you'll see 3 AI-generated caption ideas. Read through them carefully.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="secondary" gutterBottom>
                Step 3: Edit Captions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can edit any caption directly in the text boxes to improve or customize them.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="secondary" gutterBottom>
                Step 4: Customize in Editor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select an idea and use the editor on the left to drag, resize, or modify the text placement.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="secondary" gutterBottom>
                Step 5: Save & Continue
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Save & Next Topic" when ready - all 3 ideas will be saved automatically!
              </Typography>
            </Box>
          </Stack>
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 2,
              bgcolor: alpha(theme.palette.secondary.main, 0.05),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              💡 <strong>Tip:</strong> You can drag the caption text to reposition it, resize it, and edit the AI-generated text directly in the editor!
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelpDialog(false)} variant="contained" color="secondary">
            Got it!
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showConfirmDialog}
        onClose={handleCancelSave}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">
          No Changes Detected
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You haven't made any edits to the AI-generated captions. Do you still want to continue and save the original AI suggestions?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSave} color="inherit">
            No, Let Me Edit
          </Button>
          <Button onClick={handleConfirmSave} variant="contained" color="secondary" autoFocus>
            Yes, Continue
          </Button>
        </DialogActions>
      </Dialog>

      <LoadingOverlay
        open={saving}
        message="Saving AI-generated memes..."
        subtitle="Please wait while we upload all 3 ideas"
      />
    </Container>
  );
}
