import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { useSession } from "../../app/session/SessionContext";
import { exportMemePNG } from "../../Components/MemeEditor/exportMeme";
import MemeEditor, { type MemeTextLayer } from "../../Components/MemeEditor/MemeEditor";
import { uploadMemeAndInsertRow } from "../../lib/memeUpload";

import baby from "../../assets/templates/baby.jpg";
import boromir from "../../assets/templates/boromir.jpg";
import choice from "../../assets/templates/choice.jpg";
import doge from "../../assets/templates/doge.jpg";

import successkid from "../../assets/templates/baby.jpg";
import spongebob from "../../assets/templates/baby.jpg";
import pablo from "../../assets/templates/baby.jpg";
import pikachu from "../../assets/templates/baby.jpg";

import thisisfine from "../../assets/templates/baby.jpg";
import gru from "../../assets/templates/baby.jpg";
import exitImg from "../../assets/templates/baby.jpg";
import changemymind from "../../assets/templates/baby.jpg";

const TOPIC_SECONDS = 300;

type MemeTemplate = { id: string; title: string; imageUrl: string };

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

type AiMeme = {
  id: string;
  templateId: string;
  caption: string;
  layers: MemeTextLayer[];
};

type TopicState = {
  topicId: string;
  aiMemes: AiMeme[];
  selectedAiId: string | null;
  prompt: string;
  refinePrompt: string;
  lastPromptGenerated: string;
  retryCount: number;
  generating: boolean;
  memePng?: string;
  savedImageUrl?: string;
  savedImagePath?: string;
};

function makeId(prefix = "layer") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

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
      fontSize:24,
      locked: true,
    } as MemeTextLayer,
  ];
}

function normalizeAiMemes(
  input: Array<{ templateId?: string; caption?: string }>,
  templates: MemeTemplate[]
) {
  const byId = new Map(templates.map((t) => [t.id, t]));
  const safe = input
    .map((m) => ({
      templateId: m.templateId && byId.has(m.templateId) ? m.templateId : templates[0]?.id,
      caption: (m.caption ?? "").trim(),
    }))
    .filter((m) => m.templateId);

  const padded = [
    safe[0] ?? { templateId: templates[0]?.id, caption: "" },
    safe[1] ?? { templateId: templates[1]?.id ?? templates[0]?.id, caption: "" },
    safe[2] ?? { templateId: templates[2]?.id ?? templates[0]?.id, caption: "" },
  ];

  return padded.map((m) => ({
    id: makeId("ai"),
    templateId: m.templateId as string,
    caption: m.caption,
    layers: captionToLayers(m.caption),
  }));
}

async function generateAiMemes(args: {
  prompt: string;
  topicTitle: string;
  topicDescription: string;
  templates: MemeTemplate[];
}) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error("Missing VITE_OPENAI_API_KEY.");

  const baseUrl = (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) ?? "https://api.openai.com/v1";
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const templateList = args.templates
    .map((t) => `${t.id}: ${t.title}`)
    .join(", ");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "You generate meme ideas. Return JSON only with 3 items in an array called memes.",
        },
        {
          role: "user",
          content: [
            `Topic: ${args.topicTitle} - ${args.topicDescription}`,
            `Templates (pick any): ${templateList}`,
            `User prompt: ${args.prompt}`,
            "Return JSON like {\"memes\":[{\"templateId\":\"s1\",\"caption\":\"...\"}]}",
            "Captions must be under 120 characters.",
          ].join("\n"),
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? `OpenAI request failed (${res.status})`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.memes)) return parsed.memes;
  } catch {
    // fall through
  }

  return [];
}

export default function TaskAIFirst() {
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
      aiMemes: [],
      selectedAiId: null,
      prompt: "",
      refinePrompt: "",
      lastPromptGenerated: "",
      retryCount: 0,
      generating: false,
      memePng: undefined,
      savedImageUrl: undefined,
      savedImagePath: undefined,
    }))
  );

  const activeState = stateByTopic[activeIndex];
  const templates = activeTask.templates;

  const selectedAiMeme =
    activeState.aiMemes.find((m) => m.id === activeState.selectedAiId) ?? null;

  const updateActiveState = (patch: Partial<TopicState>) => {
    setStateByTopic((prev) =>
      prev.map((s, idx) => (idx === activeIndex ? { ...s, ...patch } : s))
    );
  };

  const updateMemeLayers = (memeId: string, layers: MemeTextLayer[]) => {
    const next = activeState.aiMemes.map((m) =>
      m.id === memeId ? { ...m, layers, caption: (layers.find((l) => l.locked)?.text ?? "").trim() } : m
    );
    updateActiveState({ aiMemes: next });
  };

  const runAiForTopic = async (promptOverride?: string) => {
    if (activeState.generating) return;
    updateActiveState({ generating: true });

    try {
      const prompt =
        (promptOverride ?? activeState.prompt).trim() ||
        `Generate 3 meme captions about ${activeTask.title}.`;

      const rawMemes = await generateAiMemes({
        prompt,
        topicTitle: activeTask.title,
        topicDescription: activeTask.description,
        templates,
      });

      const aiMemes = normalizeAiMemes(rawMemes, templates);
      setStateByTopic((prev) =>
        prev.map((s, idx) => {
          if (idx !== activeIndex) return s;
          const nextRetry = aiMemes.length ? 0 : s.retryCount + 1;
          return {
            ...s,
            aiMemes,
            selectedAiId: aiMemes[0]?.id ?? null,
            lastPromptGenerated: prompt,
            retryCount: nextRetry,
          };
        })
      );
      setToast({
        open: true,
        type: aiMemes.length ? "success" : "error",
        msg: aiMemes.length ? "AI memes generated." : "AI returned empty memes. Retrying...",
      });
    } catch (err: any) {
      console.error(err);
      setStateByTopic((prev) =>
        prev.map((s, idx) =>
          idx === activeIndex ? { ...s, retryCount: s.retryCount + 1 } : s
        )
      );
      setToast({
        open: true,
        type: "error",
        msg: err?.message ? `AI failed: ${err.message}` : "AI failed",
      });
    } finally {
      updateActiveState({ generating: false });
    }
  };

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
        msg: "Time is up for this topic. Please submit to continue.",
      });
    }
  }, [secondsLeft]);

  useEffect(() => {
    if (!activeState.aiMemes.length && !activeState.generating) {
      void runAiForTopic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    const prompt = activeState.prompt.trim();
    if (prompt.length < 3) return;
    if (prompt === activeState.lastPromptGenerated) return;
    if (activeState.generating) return;

    const id = window.setTimeout(() => {
      void runAiForTopic(prompt);
    }, 600);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeState.prompt, activeIndex]);

  useEffect(() => {
    if (activeState.generating) return;
    if (activeState.aiMemes.length) return;
    if (activeState.retryCount >= 3) return;

    const id = window.setTimeout(() => {
      void runAiForTopic(
        activeState.prompt.trim() ||
          `Generate 3 meme captions about ${activeTask.title}.`
      );
    }, 800);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeState.aiMemes.length, activeState.retryCount, activeIndex]);

  const handleRefineWithAi = async () => {
    if (!selectedAiMeme) {
      setToast({ open: true, type: "error", msg: "Select a meme first." });
      return;
    }

    const prompt = activeState.refinePrompt.trim();
    if (prompt.length < 3) {
      setToast({ open: true, type: "error", msg: "Add a short prompt (min 3 chars)." });
      return;
    }

    updateActiveState({ generating: true });
    try {
      const raw = await generateAiMemes({
        prompt: `Refine this caption: "${selectedAiMeme.caption}". ${prompt}`,
        topicTitle: activeTask.title,
        topicDescription: activeTask.description,
        templates,
      });
      const refined = normalizeAiMemes(raw, templates)[0];
      if (refined) updateMemeLayers(selectedAiMeme.id, refined.layers);
      setToast({ open: true, type: "success", msg: "Caption refined." });
    } catch (err: any) {
      console.error(err);
      setToast({
        open: true,
        type: "error",
        msg: err?.message ? `AI failed: ${err.message}` : "AI failed",
      });
    } finally {
      updateActiveState({ generating: false });
    }
  };

  const canContinue = Boolean(selectedAiMeme?.templateId) &&
    (selectedAiMeme?.layers.find((l) => l.locked)?.text ?? "").trim().length >= 3;

  const saveAllToSession = () => {
    const payload = stateByTopic.map((s) => ({
      participantId,
      topicId: s.topicId,
      templateId: s.aiMemes.find((m) => m.id === s.selectedAiId)?.templateId ?? null,
      captions: s.aiMemes.map((m) => m.caption),
      bestIdeaIndex: s.aiMemes.findIndex((m) => m.id === s.selectedAiId),
      bestCaption:
        s.aiMemes.find((m) => m.id === s.selectedAiId)?.caption ?? "",
      layers: s.aiMemes.find((m) => m.id === s.selectedAiId)?.layers ?? [],
      memePng: s.memePng,
      savedImageUrl: s.savedImageUrl,
      savedImagePath: s.savedImagePath,
    }));

    (session as any).setAiFirstResults?.(payload);
    session.setCaptionIdeas?.(payload.flatMap((p: any) => p.captions));
  };

  const goNext = async () => {
    if (saving) return;

    if (!canContinue || !selectedAiMeme) {
      setToast({ open: true, type: "error", msg: "Select a meme and ensure the caption is valid." });
      return;
    }

    setSaving(true);
    try {
      const template = templates.find((t) => t.id === selectedAiMeme.templateId);
      if (!template) throw new Error("Template not found.");

      const memePng = await exportMemePNG({
        imageUrl: template.imageUrl,
        layers: selectedAiMeme.layers,
        width: 1400,
      });

      updateActiveState({ memePng });

      const result = await uploadMemeAndInsertRow({
        bucket: "memes",
        participantId,
        prolificPid: session.prolificPid,
        studyId: session.studyId,
        sessionId: session.sessionId,
        task: "ai-first",
        topicId: activeTask.topicId,
        templateId: selectedAiMeme.templateId,
        ideaIndex: activeState.aiMemes.findIndex((m) => m.id === selectedAiMeme.id),
        caption: selectedAiMeme.caption ?? "",
        layers: selectedAiMeme.layers,
        memeDataUrl: memePng,
      });

      updateActiveState({
        savedImageUrl: result.publicUrl,
        savedImagePath: result.filePath,
      });

      setToast({ open: true, type: "success", msg: "Saved" });

      const isLast = activeIndex === tasks.length - 1;
      if (!isLast) {
        setActiveIndex((i) => i + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      saveAllToSession();
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
            AI-first Meme Task
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Topic {activeIndex + 1} of {tasks.length} - AI generates 3 memes - pick one - enhance it
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Participant: <b>{participantId}</b>
          </Typography>
        </Stack>

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
                1) AI-generated memes (pick one)
              </Typography>
              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1.5} sx={{ mb: 2 }}>
                {/* <TextField
                  label="AI prompt (optional)"
                  placeholder="Give the AI a hint about the jokes you want"
                  value={activeState.prompt}
                  onChange={(e) => updateActiveState({ prompt: e.target.value })}
                  fullWidth
                  multiline
                  minRows={2}
                /> */}
                <Typography variant="caption" color="text.secondary">
                  AI auto-generates 3 memes from the topic and 4 templates.
                </Typography>
                {activeState.generating && <LinearProgress sx={{ mt: 1 }} />}
              </Stack>

              <Stack spacing={1.5}>
                {!activeState.aiMemes.length && (
                  <Alert severity="info">Generating AI memes...</Alert>
                )}
                {activeState.aiMemes.map((meme) => {
                  const template = templates.find((t) => t.id === meme.templateId);
                  const selected = meme.id === activeState.selectedAiId;
                  return (
                    <Card
                      key={meme.id}
                      variant="outlined"
                      sx={{
                        borderColor: selected ? "primary.main" : "divider",
                        borderWidth: selected ? 2 : 1,
                      }}
                    >
                      <CardActionArea onClick={() => updateActiveState({ selectedAiId: meme.id })}>
                        <CardMedia
                          component="img"
                          image={template?.imageUrl ?? ""}
                          alt={template?.title ?? "meme"}
                          sx={{ height: 160, objectFit: "cover" }}
                        />
                        <CardContent>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {template?.title ?? "Template"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {meme.caption || "(empty caption)"}
                          </Typography>
                          <Typography variant="caption" color={selected ? "primary.main" : "text.secondary"}>
                            {selected ? "Selected" : "Tap to select"}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800}>
                2) Enhance the selected meme
              </Typography>
              <Divider sx={{ my: 1.5 }} />

              {!selectedAiMeme ? (
                <Alert severity="info">Select one of the AI memes to edit.</Alert>
              ) : (
                <Stack spacing={1.5}>
                  <MemeEditor
                    imageUrl={templates.find((t) => t.id === selectedAiMeme.templateId)?.imageUrl ?? null}
                    layers={selectedAiMeme.layers}
                    onLayersChange={(layers) => updateMemeLayers(selectedAiMeme.id, layers)}
                    maxWidth={760}
                    maxHeight={520}
                  />

                  <TextField
                    label="Refine with AI (optional)"
                    placeholder="Ask the AI to punch up or rewrite the caption"
                    value={activeState.refinePrompt}
                    onChange={(e) => updateActiveState({ refinePrompt: e.target.value })}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleRefineWithAi}
                    disabled={activeState.generating}
                  >
                    {activeState.generating ? "Refining..." : "Use AI again"}
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Button variant="outlined" onClick={goPrev} disabled={activeIndex === 0 || saving}>
            Back
          </Button>

          <Button variant="contained" onClick={goNext} disabled={!canContinue || saving}>
            {saving
              ? "Saving..."
              : activeIndex === tasks.length - 1
              ? "Finish - Done"
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
