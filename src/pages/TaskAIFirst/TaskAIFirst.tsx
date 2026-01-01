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
  Container,
  Divider,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EditIcon from "@mui/icons-material/Edit";

import { useSession } from "../../app/session/SessionContext";
import LoadingOverlay from "../../Components/Layout/LoadingOverlay";
import { exportMemePNG } from "../../Components/MemeEditor/exportMeme";
import MemeEditor, { type MemeTextLayer } from "../../Components/MemeEditor/MemeEditor";
import { uploadMemeAndInsertRow } from "../../lib/memeUpload";

// School templates
import successKid from "../../assets/templates/Success_Kid.jpg";
import disasterGirl from "../../assets/templates/Disaster_Girl.jpg";
import thirdWorldKid from "../../assets/templates/Third_World_Skeptical_Kid.jpg";
import waitingSkeleton from "../../assets/templates/Waiting_Skeleton.jpg";

// Football templates
import laughingLeo from "../../assets/templates/Laughing_Leo.jpg";
import youGuysGettingPaid from "../../assets/templates/You_Guys_Are_Getting_Paid.jpg";
import surprisedPikachu from "../../assets/templates/Surprised_Pikachu.jpg";
import absoluteCinema from "../../assets/templates/Absolute_Cinema.jpg";

// Work/Office templates
import theOfficeCongrats from "../../assets/templates/The_Office_Congratulations.jpg";
import oneDoesNotSimply from "../../assets/templates/One_Does_Not_Simply.jpg";
import changeMind from "../../assets/templates/Change_My_Mind.jpg";
import scientist from "../../assets/templates/You_know_Im_something_of_a_scientist_myself.jpg";

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
      { id: "s1", title: "Success Kid", imageUrl: successKid },
      { id: "s2", title: "Disaster Girl", imageUrl: disasterGirl },
      { id: "s3", title: "Third World Kid", imageUrl: thirdWorldKid },
      { id: "s4", title: "Waiting Skeleton", imageUrl: waitingSkeleton },
    ],
  },
  {
    topicId: "football",
    title: "Playing Football",
    description: "A meme about football situations.",
    templates: [
      { id: "f1", title: "Laughing Leo", imageUrl: laughingLeo },
      { id: "f2", title: "Getting Paid", imageUrl: youGuysGettingPaid },
      { id: "f3", title: "Surprised Pikachu", imageUrl: surprisedPikachu },
      { id: "f4", title: "Absolute Cinema", imageUrl: absoluteCinema },
    ],
  },
  {
    topicId: "work",
    title: "Work / Office",
    description: "Relatable office vibes.",
    templates: [
      { id: "w1", title: "Office Congratulations", imageUrl: theOfficeCongrats },
      { id: "w2", title: "One Does Not Simply", imageUrl: oneDoesNotSimply },
      { id: "w3", title: "Change My Mind", imageUrl: changeMind },
      { id: "w4", title: "Scientist", imageUrl: scientist },
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
  aiSelectedTemplateId: string | null;
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

async function imageUrlToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// First API call: AI selects the best template
async function selectBestTemplate(args: {
  topicTitle: string;
  topicDescription: string;
  templates: MemeTemplate[];
}): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error("Missing VITE_OPENAI_API_KEY.");

  const baseUrl = (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) ?? "https://api.openai.com/v1";
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  // Convert all template images to base64
  const templateImagesBase64 = await Promise.all(
    args.templates.map(async (t) => ({
      id: t.id,
      title: t.title,
      base64: await imageUrlToBase64(t.imageUrl),
    }))
  );

  // Build message content with all 4 images
  const userContent: any[] = [
    {
      type: "text",
      text: [
        `Topic: ${args.topicTitle} - ${args.topicDescription}`,
        "",
        "I'm showing you 4 meme templates below. Each image is labeled with its ID and title.",
        "Analyze ALL 4 images and determine which template BEST fits this topic based on:",
        "  - Visual context and emotion in the image",
        "  - Meme format compatibility",
        "  - Relevance to the topic",
        "",
        "Return ONLY valid JSON in this exact format:",
        '{"selectedTemplateId":"<id>"}',
        "",
        "Return ONLY the JSON, no explanation or markdown.",
      ].join("\n"),
    },
  ];

  // Add each template image
  templateImagesBase64.forEach((img) => {
    userContent.push({
      type: "text",
      text: `\n--- Template ID: ${img.id} | Title: ${img.title} ---`,
    });
    userContent.push({
      type: "image_url",
      image_url: {
        url: img.base64,
        detail: "low",
      },
    });
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: "You are a meme expert. You analyze meme template images and select the most appropriate one for a given topic.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? `OpenAI request failed (${res.status})`);
  }

  const data = await res.json();
  let content = data?.choices?.[0]?.message?.content ?? "";
  
  console.log("🎯 Template Selection Response:", content);
  
  if (!content) return args.templates[0].id;

  // Strip markdown code fences
  content = content.trim();
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\s*\n?/, "");
    content = content.replace(/\n?```\s*$/, "");
    content = content.trim();
  }

  try {
    const parsed = JSON.parse(content);
    const selectedId = parsed?.selectedTemplateId;
    if (selectedId && args.templates.some(t => t.id === selectedId)) {
      console.log("✅ AI selected template:", selectedId);
      return selectedId;
    }
  } catch (e) {
    console.error("❌ Template selection parse error:", e);
  }

  // Fallback to first template
  return args.templates[0].id;
}

// Second API call: Generate 3 captions for the selected template
async function generateCaptionsForTemplate(args: {
  prompt: string;
  topicTitle: string;
  topicDescription: string;
  template: MemeTemplate;
}): Promise<string[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error("Missing VITE_OPENAI_API_KEY.");

  const baseUrl = (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) ?? "https://api.openai.com/v1";
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  // Convert selected template to base64
  const templateBase64 = await imageUrlToBase64(args.template.imageUrl);

  const userContent: any[] = [
    {
      type: "text",
      text: [
        `Topic: ${args.topicTitle} - ${args.topicDescription}`,
        `User prompt: ${args.prompt}`,
        "",
        "This is the selected meme template:",
      ].join("\n"),
    },
    {
      type: "image_url",
      image_url: {
        url: templateBase64,
        detail: "low",
      },
    },
    {
      type: "text",
      text: [
        "",
        "Generate 3 DIFFERENT creative and funny captions for this template.",
        "",
        "Return ONLY valid JSON in this exact format:",
        '{"captions":["caption 1","caption 2","caption 3"]}',
        "",
        "Requirements:",
        "- Each caption must be unique, funny, and under 120 characters",
        "- Return ONLY the JSON, no explanation or markdown",
      ].join("\n"),
    },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: "You are a meme expert. You create funny, relatable captions for meme templates.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? `OpenAI request failed (${res.status})`);
  }

  const data = await res.json();
  let content = data?.choices?.[0]?.message?.content ?? "";
  
  console.log("💬 Caption Generation Response:", content);
  
  if (!content) return [];

  // Strip markdown code fences
  content = content.trim();
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\s*\n?/, "");
    content = content.replace(/\n?```\s*$/, "");
    content = content.trim();
  }

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed?.captions)) {
      console.log("✅ Generated captions:", parsed.captions);
      return parsed.captions.slice(0, 3);
    }
  } catch (e) {
    console.error("❌ Caption parse error:", e);
  }

  return [];
}

async function generateAiMemes(args: {
  prompt: string;
  topicTitle: string;
  topicDescription: string;
  templates: MemeTemplate[];
}) {
  // Step 1: AI selects the best template from all 4
  console.log("🚀 Step 1: Asking AI to select best template...");
  const selectedTemplateId = await selectBestTemplate({
    topicTitle: args.topicTitle,
    topicDescription: args.topicDescription,
    templates: args.templates,
  });

  const selectedTemplate = args.templates.find(t => t.id === selectedTemplateId);
  if (!selectedTemplate) {
    throw new Error("Selected template not found");
  }

  // Step 2: Generate 3 captions for the selected template
  console.log("🚀 Step 2: Generating 3 captions for selected template...");
  const captions = await generateCaptionsForTemplate({
    prompt: args.prompt,
    topicTitle: args.topicTitle,
    topicDescription: args.topicDescription,
    template: selectedTemplate,
  });

  // Return in the expected format
  return captions.map(caption => ({
    templateId: selectedTemplateId,
    caption: caption.trim(),
  }));
}

function normalizeAiMemes(
  input: Array<{ templateId?: string; caption?: string }>,
  templates: MemeTemplate[]
) {
  const byId = new Map(templates.map((t) => [t.id, t]));
  
  // All captions should use the same templateId (from AI selection)
  const selectedTemplateId = input[0]?.templateId && byId.has(input[0].templateId) 
    ? input[0].templateId 
    : templates[0]?.id;

  // Map captions
  const safe = input
    .slice(0, 3)
    .map((m) => ({
      templateId: selectedTemplateId,
      caption: (m.caption ?? "").trim(),
    }));

  // Ensure we have exactly 3 captions
  while (safe.length < 3) {
    safe.push({ templateId: selectedTemplateId as string, caption: "" });
  }

  return {
    selectedTemplateId: selectedTemplateId as string,
    memes: safe.map((m) => ({
      id: makeId("ai"),
      templateId: m.templateId as string,
      caption: m.caption,
      layers: captionToLayers(m.caption),
    }))
  };
}

// OLD IMPLEMENTATION - Commented out for build
// Removed old generateAiMemes - now replaced with two-step process above
/* async function generateAiMemes_OLD(args: {
  prompt: string;
  topicTitle: string;
  topicDescription: string;
  templates: MemeTemplate[];
}) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error("Missing VITE_OPENAI_API_KEY.");

  const baseUrl = (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) ?? "https://api.openai.com/v1";
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  // Convert all template images to base64
  const templateImagesBase64 = await Promise.all(
    args.templates.map(async (t) => ({
      id: t.id,
      title: t.title,
      base64: await imageUrlToBase64(t.imageUrl),
    }))
  );

  // Build the user message content with images
  const userContent: any[] = [
    {
      type: "text",
      text: [
        `Topic: ${args.topicTitle} - ${args.topicDescription}`,
        `User prompt: ${args.prompt}`,
        "",
        "I'm showing you 4 meme templates below. Each image is labeled with its ID and title.",
        "Step 1: Analyze ALL 4 images and determine which template BEST fits this topic based on:",
        "  - Visual context and emotion",
        "  - Meme format compatibility",
        "  - Relevance to the topic",
        "",
        "Step 2: Generate 3 DIFFERENT creative and funny captions for your selected template.",
        "",
        "Return ONLY valid JSON in this exact format:",
        '{"memes":[{"templateId":"<selected_id>","caption":"..."},{"templateId":"<selected_id>","caption":"..."},{"templateId":"<selected_id>","caption":"..."}]}',
        "",
        "Requirements:",
        "- All 3 memes MUST use the SAME templateId (the one you visually selected)",
        "- Each caption must be unique, funny, and under 120 characters",
        "- Return ONLY the JSON, no explanation",
      ].join("\n"),
    },
  ];

  // Add each template image
  templateImagesBase64.forEach((img) => {
    userContent.push({
      type: "text",
      text: `\n--- Template ID: ${img.id} | Title: ${img.title} ---`,
    });
    userContent.push({
      type: "image_url",
      image_url: {
        url: img.base64,
        detail: "low",
      },
    });
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are a meme expert. You analyze meme template images and create funny, relatable captions. You select the best template by visually analyzing the images provided.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? `OpenAI request failed (${res.status})`);
  }

  const data = await res.json();
  let content = data?.choices?.[0]?.message?.content ?? "";
  
  console.log("🤖 AI Response content:", content);
  
  if (!content) return [];

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  content = content.trim();
  if (content.startsWith("```")) {
    // Remove opening fence (e.g., ```json or ```)
    content = content.replace(/^```(?:json)?\s*\n?/, "");
    // Remove closing fence
    content = content.replace(/\n?```\s*$/, "");
    content = content.trim();
  }

  try {
    const parsed = JSON.parse(content);
    console.log("📋 Parsed JSON:", parsed);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.memes)) return parsed.memes;
  } catch (e) {
    console.error("❌ JSON parse error:", e);
    console.error("Raw content:", content);
  }

  return [];
}
*/

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
      aiSelectedTemplateId: null,
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
    console.log("🔧 Updating active state with patch:", patch);
    setStateByTopic((prev) => {
      const updated = prev.map((s, idx) => (idx === activeIndex ? { ...s, ...patch } : s));
      console.log("📝 New state after update:", updated[activeIndex]);
      return updated;
    });
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

      console.log("🚀 Calling AI with prompt:", prompt);
      
      const rawMemes = await generateAiMemes({
        prompt,
        topicTitle: activeTask.title,
        topicDescription: activeTask.description,
        templates,
      });

      console.log("📦 Raw memes from AI:", rawMemes);

      const { selectedTemplateId, memes: aiMemes } = normalizeAiMemes(rawMemes, templates);
      
      console.log("✅ Normalized memes:", aiMemes);
      console.log("🎯 Selected template:", selectedTemplateId);
      
      setStateByTopic((prev) =>
        prev.map((s, idx) => {
          if (idx !== activeIndex) return s;
          const nextRetry = aiMemes.length && aiMemes.some(m => m.caption) ? 0 : s.retryCount + 1;
          return {
            ...s,
            aiMemes,
            aiSelectedTemplateId: selectedTemplateId,
            selectedAiId: aiMemes[0]?.id ?? null,
            lastPromptGenerated: prompt,
            retryCount: nextRetry,
          };
        })
      );
      setToast({
        open: true,
        type: aiMemes.length && aiMemes.some(m => m.caption) ? "success" : "error",
        msg: aiMemes.length && aiMemes.some(m => m.caption) ? "AI selected template and generated 3 captions." : "AI returned empty memes. Retrying...",
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
    console.log("🔄 Active index changed to:", activeIndex);
    console.log("📊 Current state for this topic:", activeState);
    
    if (!activeState.aiMemes.length && !activeState.generating) {
      console.log("⚠️ No memes found, generating...");
      void runAiForTopic();
    } else {
      console.log("✅ Memes already exist:", activeState.aiMemes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // Disabled automatic prompt-based regeneration to prevent unwanted clearing of results
  // useEffect(() => {
  //   const prompt = activeState.prompt.trim();
  //   if (prompt.length < 3) return;
  //   if (prompt === activeState.lastPromptGenerated) return;
  //   if (activeState.generating) return;

  //   const id = window.setTimeout(() => {
  //     void runAiForTopic(prompt);
  //   }, 600);

  //   return () => window.clearTimeout(id);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [activeState.prompt, activeIndex]);

  // Disabled automatic retries to prevent clearing of valid results
  // useEffect(() => {
  //   if (activeState.generating) return;
  //   if (activeState.aiMemes.length) return;
  //   if (activeState.retryCount >= 3) return;

  //   const id = window.setTimeout(() => {
  //     void runAiForTopic(
  //       activeState.prompt.trim() ||
  //         `Generate 3 meme captions about ${activeTask.title}.`
  //     );
  //   }, 800);

  //   return () => window.clearTimeout(id);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [activeState.aiMemes.length, activeState.retryCount, activeIndex]);

  // const handleRefineWithAi = async () => {
  //   if (!selectedAiMeme) {
  //     setToast({ open: true, type: "error", msg: "Select a meme first." });
  //     return;
  //   }

  //   const prompt = activeState.refinePrompt.trim();
  //   if (prompt.length < 3) {
  //     setToast({ open: true, type: "error", msg: "Add a short prompt (min 3 chars)." });
  //     return;
  //   }

  //   updateActiveState({ generating: true });
  //   try {
  //     const raw = await generateAiMemes({
  //       prompt: `Refine this caption: "${selectedAiMeme.caption}". ${prompt}`,
  //       topicTitle: activeTask.title,
  //       topicDescription: activeTask.description,
  //       templates,
  //     });
  //     const { memes: refinedMemes } = normalizeAiMemes(raw, templates);
  //     const refined = refinedMemes[0];
  //     if (refined) updateMemeLayers(selectedAiMeme.id, refined.layers);
  //     setToast({ open: true, type: "success", msg: "Caption refined." });
  //   } catch (err: any) {
  //     console.error(err);
  //     setToast({
  //       open: true,
  //       type: "error",
  //       msg: err?.message ? `AI failed: ${err.message}` : "AI failed",
  //     });
  //   } finally {
  //     updateActiveState({ generating: false });
  //   }
  // };

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
      const template = templates.find((t) => t.id === activeState.aiSelectedTemplateId);
      if (!template) throw new Error("Template not found.");

      // Step 1: Save all 3 AI-generated ideas with task='ai'
      for (let i = 0; i < activeState.aiMemes.length; i++) {
        const aiMeme = activeState.aiMemes[i];
        const aiMemePng = await exportMemePNG({
          imageUrl: template.imageUrl,
          layers: aiMeme.layers,
          width: 1400,
        });

        await uploadMemeAndInsertRow({
          bucket: "memes",
          participantId,
          prolificPid: session.prolificPid,
          studyId: session.studyId,
          sessionId: session.sessionId,
          task: "ai",  // Mark as AI-generated
          topicId: activeTask.topicId,
          templateId: template.id,
          ideaIndex: i,
          caption: aiMeme.caption ?? "",
          layers: aiMeme.layers,
          memeDataUrl: aiMemePng,
        });
      }

      // Step 2: Save the human-refined final selection with task='humanrefined'
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
        task: "humanrefined",  // Mark as human-refined version
        topicId: activeTask.topicId,
        templateId: template.id,
        ideaIndex: activeState.aiMemes.findIndex((m) => m.id === selectedAiMeme.id),
        caption: selectedAiMeme.caption ?? "",
        layers: selectedAiMeme.layers,
        memeDataUrl: memePng,
      });

      updateActiveState({
        savedImageUrl: result.publicUrl,
        savedImagePath: result.filePath,
      });

      setToast({ open: true, type: "success", msg: "Saved all AI ideas + refined version!" });

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
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AutoAwesomeIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight={800}>
              AI-first Meme Task
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ opacity: 0.95 }}>
            Topic {activeIndex + 1} of {tasks.length} • AI selects best template & generates 3 captions • pick one • refine it
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Participant: <b>{participantId}</b>
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
            background: `linear-gradient(to right, ${alpha(theme.palette.secondary.main, 0.05)}, ${alpha(theme.palette.info.main, 0.05)})`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AutoAwesomeIcon sx={{ color: "secondary.main", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  {activeTask.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {activeTask.description}
                </Typography>
              </Box>
            </Stack>
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
                <AutoAwesomeIcon sx={{ color: "secondary.main", fontSize: 24 }} />
                <Typography variant="h6" fontWeight={800}>
                  1) AI-generated memes (pick one)
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />

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
                  AI analyzes 4 templates, picks the best one, and generates 3 different captions for it.
                </Typography>
                {activeState.generating && <LinearProgress sx={{ mt: 1 }} />}
                
                {/* Show retry button if AI failed or returned empty memes */}
                {!activeState.generating && activeState.retryCount > 0 && !activeState.aiMemes.some(m => m.caption) && (
                  <Alert 
                    severity="error" 
                    action={
                      <Button 
                        color="inherit" 
                        size="small" 
                        variant="outlined"
                        onClick={() => runAiForTopic()}
                      >
                        Retry
                      </Button>
                    }
                  >
                    AI failed to generate memes. Click Retry to try again.
                  </Alert>
                )}
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
                      elevation={selected ? 4 : 1}
                      sx={{
                        border: 2,
                        borderColor: selected ? "secondary.main" : "transparent",
                        borderRadius: 2,
                        bgcolor: selected ? alpha(theme.palette.secondary.main, 0.08) : "background.paper",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: "secondary.main",
                          transform: "translateY(-4px)",
                          boxShadow: 4,
                        },
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
                  2) Enhance the selected meme
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />

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

                  {/* <TextField
                    label="Refine with AI (optional)"
                    placeholder="Ask the AI to punch up or rewrite the caption"
                    value={activeState.refinePrompt}
                    onChange={(e) => updateActiveState({ refinePrompt: e.target.value })}
                    fullWidth
                    multiline
                    minRows={2}
                  /> */}
                  {/* <Button
                    variant="outlined"
                    onClick={handleRefineWithAi}
                    disabled={activeState.generating}
                  >
                    {activeState.generating ? "Refining..." : "Use AI again"}
                  </Button> */}
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
              onClick={goNext}
              disabled={!canContinue || saving}
              sx={{
                px: 4,
                borderRadius: 2,
                boxShadow: 3,
                "&:hover": {
                  boxShadow: 6,
                },
              }}
            >
              {saving
                ? "Saving..."
                : activeIndex === tasks.length - 1
                ? "Finish - Done"
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
        message="Saving your meme..."
        subtitle="Please wait while we upload your creation"
      />
    </Container>
  );
}
