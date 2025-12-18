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
} from "@mui/material";
import { useSession } from "../../app/session/SessionContext";
import TemplateSelector, { type MemeTemplate } from "../../Components/Templates/TemplateSelector";
import CaptionIdeasForm from "../../Components/CaptionsIdeas/CaptionIdeasForm";
import MemeEditor, { type MemeTextLayer } from "../../Components/MemeEditor/MemeEditor";
import { exportMemePNG, downloadDataUrl } from "../../Components/MemeEditor/exportMeme";

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

const TOPIC_SECONDS = 60;

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

type TopicState = {
  topicId: string;
  selectedTemplateId: string | null;

  ideas: [string, string, string];
  bestIdeaIndex: 0 | 1 | 2;

  layers: MemeTextLayer[];

  // ✅ exported final image (base64 png)
  memePng?: string;
};

function makeId(prefix = "layer") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export default function TaskHumanFirst() {
  const nav = useNavigate();
  const session = useSession();

  // ✅ participant id (adapt later if your session uses a different key)
  const participantId =
    (session as any).participantId ||
    (session as any).participant?.id ||
    (session as any).participant_id ||
    (session as any).userId ||
    "unknown";

  const tasks = useMemo(() => FALLBACK_TASKS, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeTask = tasks[activeIndex];

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
      ideas: ["", "", ""],
      bestIdeaIndex: 0,
      layers: [
        {
          id: "best",
          text: "",
          xPct: 10,
          yPct: 20,
          fontSize: 40,
          locked: true, // best caption cannot be deleted
        } as any,
      ],
    }))
  );

  const activeState = stateByTopic[activeIndex];

  const activeTemplates = activeTask.templates;
  const selectedTemplate =
    activeTemplates.find((t) => t.id === activeState.selectedTemplateId) ?? null;

  const canContinue = useMemo(() => {
    const templateOk = !!activeState.selectedTemplateId;
    const ideasOk = activeState.ideas.every((x) => x.trim().length >= 3);
    const bestOk = activeState.ideas[activeState.bestIdeaIndex].trim().length >= 3;
    return templateOk && ideasOk && bestOk;
  }, [activeState.selectedTemplateId, activeState.ideas, activeState.bestIdeaIndex]);

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

  const syncBestLayerText = (ideas: [string, string, string], bestIdx: 0 | 1 | 2) => {
    const bestText = (ideas[bestIdx] ?? "").trim();
    const nextLayers = activeState.layers.map((l) =>
      l.id === "best" ? { ...l, text: bestText } : l
    );
    updateActiveState({ layers: nextLayers });
  };

  const handleSelectTemplate = (templateId: string) => {
    updateActiveState({ selectedTemplateId: templateId });
  };

  const handleIdeasChange = (ideas: [string, string, string]) => {
    updateActiveState({ ideas });
    syncBestLayerText(ideas, activeState.bestIdeaIndex);
  };

  const handleBestChange = (idx: 0 | 1 | 2) => {
    updateActiveState({ bestIdeaIndex: idx });
    syncBestLayerText(activeState.ideas, idx);
  };

  const handleLayersChange = (layers: MemeTextLayer[]) => {
    updateActiveState({ layers });
  };

  const addExtraTextBox = () => {
    const next = [
      ...activeState.layers,
      {
        id: makeId("extra"),
        text: "New text",
        xPct: 15,
        yPct: 60,
        fontSize: 32,
        locked: false,
      } as any,
    ];
    updateActiveState({ layers: next });
  };

  const saveAllToSession = () => {
    const payload = stateByTopic.map((s) => ({
      participantId,
      topicId: s.topicId,
      templateId: s.selectedTemplateId,
      ideas: s.ideas.map((x) => x.trim()),
      bestIdeaIndex: s.bestIdeaIndex,
      bestCaption: s.ideas[s.bestIdeaIndex].trim(),
      layers: s.layers,
      memePng: s.memePng,
    }));

    (session as any).setHumanFirstResults?.(payload);
    session.setCaptionIdeas?.(payload.flatMap((p) => p.ideas));
  };

  // ✅ EXPORT + DOWNLOAD PNG on each topic submit
  const goNext = async () => {
    if (!canContinue) {
      setToast({
        open: true,
        type: "error",
        msg: "Select a template, write 3 captions (min 3 chars), and pick the best one.",
      });
      return;
    }

    if (!selectedTemplate) {
      setToast({ open: true, type: "error", msg: "Please select a template." });
      return;
    }

    try {
      const memePng = await exportMemePNG({
        imageUrl: selectedTemplate.imageUrl,
        layers: activeState.layers,
        width: 1400,
      });

      updateActiveState({ memePng });

      const safePid = String(participantId).replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeTopic = String(activeTask.topicId).replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeTpl = String(activeState.selectedTemplateId).replace(/[^a-zA-Z0-9_-]/g, "_");

      const filename = `participant_${safePid}__topic_${safeTopic}__template_${safeTpl}.png`;
      downloadDataUrl(memePng, filename);

      setToast({ open: true, type: "success", msg: "Saved topic + downloaded image!" });

      const isLast = activeIndex === tasks.length - 1;
      if (!isLast) {
        setActiveIndex((i) => i + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      saveAllToSession();
      nav("/done");
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        type: "error",
        msg: "Failed to export image. Check console for details.",
      });
    }
  };

  const goPrev = () => {
    if (activeIndex === 0) return;
    setActiveIndex((i) => i - 1);
  };

  const progressPct = Math.round(((TOPIC_SECONDS - secondsLeft) / TOPIC_SECONDS) * 100);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={800}>
            Human-first Meme Task
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Topic {activeIndex + 1} of {tasks.length} • Pick template • Write 3 captions • Choose best • Add extra text boxes
          </Typography>
        </Stack>

        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Time remaining: {secondsLeft}s
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  You have 1 minute per topic.
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <LinearProgress variant="determinate" value={progressPct} />
              </Box>
            </Stack>
          </CardContent>
        </Card>

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
              <TemplateSelector
                templates={activeTemplates}
                selectedId={activeState.selectedTemplateId}
                onSelect={handleSelectTemplate}
              />
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800}>
                2) Write 3 caption ideas + pick the best
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <CaptionIdeasForm
                ideas={activeState.ideas}
                bestIdeaIndex={activeState.bestIdeaIndex}
                onIdeasChange={handleIdeasChange}
                onBestChange={handleBestChange}
              />
            </CardContent>
          </Card>
        </Stack>

        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  3) Create the meme (best caption + extra text boxes)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Drag text, change font size, add more boxes anywhere.
                </Typography>
              </Box>

              <Button variant="outlined" onClick={addExtraTextBox} disabled={!selectedTemplate}>
                + Add text box
              </Button>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <MemeEditor
              imageUrl={selectedTemplate?.imageUrl ?? null}
              layers={activeState.layers}
              onLayersChange={handleLayersChange}
              disabled={!selectedTemplate}
            />
          </CardContent>
        </Card>

        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Button variant="outlined" onClick={goPrev} disabled={activeIndex === 0}>
            Back
          </Button>

          <Button variant="contained" onClick={goNext} disabled={!canContinue}>
            {activeIndex === tasks.length - 1 ? "Finish → Done" : "Save & Next Topic"}
          </Button>
        </Stack>
      </Stack>

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
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
