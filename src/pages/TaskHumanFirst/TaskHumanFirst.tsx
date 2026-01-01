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
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { useSession } from "../../app/session/SessionContext";
import TemplateSelector, { type MemeTemplate } from "../../Components/Templates/TemplateSelector";
import CaptionIdeasForm from "../../Components/CaptionsIdeas/CaptionIdeasForm";
import MemeEditor, { type MemeTextLayer } from "../../Components/MemeEditor/MemeEditor";
import { exportMemePNG } from "../../Components/MemeEditor/exportMeme";
import { uploadMemeAndInsertRow } from "../../lib/memeUpload";

// ✅ import images from src/assets
import baby from "../../assets/templates/baby.jpg";
import boromir from "../../assets/templates/boromir.jpg";
import choice from "../../assets/templates/choice.jpg";
import doge from "../../assets/templates/doge.jpg";

// (you used baby for all here - replace later with real images)
import successkid from "../../assets/templates/baby.jpg";
import spongebob from "../../assets/templates/baby.jpg";
import pablo from "../../assets/templates/baby.jpg";
import pikachu from "../../assets/templates/baby.jpg";

import thisisfine from "../../assets/templates/baby.jpg";
import gru from "../../assets/templates/baby.jpg";
import exitImg from "../../assets/templates/baby.jpg";
import changemymind from "../../assets/templates/baby.jpg";

const TOPIC_SECONDS = 300;

const FALLBACK_TASKS: {
  topicId: string;
  title: string;
  description: string;
  templates: MemeTemplate[];
}[] = [
  {
    topicId: "school",
    title: "School",
    description: "Something relatable about school life.",
    templates: [
      { id: "s1", title: "Baby", imageUrl: baby },
      { id: "s2", title: "Boromir", imageUrl: boromir },
      { id: "s3", title: "Choice", imageUrl: choice },
      { id: "s4", title: "Doge", imageUrl: doge },
    ],
  },
  {
    topicId: "football",
    title: "Playing Football",
    description: "A meme about football situations.",
    templates: [
      { id: "f1", title: "Success Kid", imageUrl: successkid },
      { id: "f2", title: "SpongeBob", imageUrl: spongebob },
      { id: "f3", title: "Pablo", imageUrl: pablo },
      { id: "f4", title: "Pikachu", imageUrl: pikachu },
    ],
  },
  {
    topicId: "work",
    title: "Work / Office",
    description: "Relatable office vibes.",
    templates: [
      { id: "w1", title: "This is Fine", imageUrl: thisisfine },
      { id: "w2", title: "Gru Plan", imageUrl: gru },
      { id: "w3", title: "Exit", imageUrl: exitImg },
      { id: "w4", title: "Change My Mind", imageUrl: changemymind },
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
  const nav = useNavigate();
  const session = useSession();

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

  const goPrev = () => {
    if (activeIndex === 0) return;
    setActiveIndex((i) => i - 1);
  };

  const progressPct = Math.round(((TOPIC_SECONDS - secondsLeft) / TOPIC_SECONDS) * 100);
  const isLowTime = secondsLeft <= 10;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
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

      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={800}>
            Human-first Meme Task
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Topic {activeIndex + 1} of {tasks.length} • Pick template • Write 3 captions • Select idea to edit • Add extra text boxes
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Participant: <b>{participantId}</b>
          </Typography>
        </Stack>

        {/* Topic */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={800}>
              {activeTask.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {activeTask.description}
            </Typography>
          </CardContent>
        </Card>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800}>
                1) Choose a template
              </Typography>
              <Divider sx={{ my: 1.5 }} />
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
                  
                  {/* Idea Selector */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
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
                            sx={{
                              flex: 1,
                              cursor: 'pointer',
                              border: isSelected ? 2 : 1,
                              borderColor: isSelected ? 'primary.main' : 'divider',
                              bgcolor: isSelected ? 'primary.50' : 'background.paper',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: 'primary.main',
                                transform: 'translateY(-2px)',
                                boxShadow: 2,
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

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800}>
                2) Write 3 caption ideas
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <CaptionIdeasForm
                ideas={activeState.ideas}
                bestIdeaIndex={activeState.bestIdeaIndex}
                onIdeaLayersChange={(idx, layers) => {
                  const nextIdeas = activeState.ideas.map((idea, i) =>
                    i === idx ? { ...idea, layers } : idea
                  ) as [IdeaState, IdeaState, IdeaState];
                  updateActiveState({ ideas: nextIdeas });
                }}
                onBestChange={handleBestChange}
                hideBestPicker
              />
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

        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Button variant="outlined" onClick={goPrev} disabled={activeIndex === 0 || saving}>
            Back
          </Button>

          <Button variant="contained" onClick={goNext} disabled={!canContinue || saving}>
            {saving
              ? "Saving..."
              : activeIndex === tasks.length - 1
              ? "Finish → Done"
              : "Save & Next Topic"}
          </Button>
        </Stack>
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
    </Box>
  );
}
