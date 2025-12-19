import type { Meme, Topic, Template } from "../app/session/types";

export async function generateMemesMock(): Promise<Meme[]> {
  // Replace later with real fetch("/api/meme")
  return [
    {
      id: crypto.randomUUID(),
      templateId: "t1",
      caption: "When the code works on the first try… and you don’t trust it.",
      imageUrl: "/templates/t1.png",
      source: "ai",
    },
  ];
}

function tryExtractJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (err) {
        // fallthrough
      }
    }
    const objStart = text.indexOf("{");
    const objEnd = text.lastIndexOf("}");
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      try {
        return JSON.parse(text.slice(objStart, objEnd + 1));
      } catch (err) {
        // fallthrough
      }
    }
    throw new Error("Failed to parse JSON from assistant response");
  }
}

export async function generateMemesAI(
  topic: Topic | null,
  templates: Template[],
  apiKey?: string
): Promise<Meme[]> {
  if (!topic) return [];

  const key = apiKey ?? (import.meta.env.VITE_OPENAI_KEY as string | undefined);
  if (!key) {
    console.warn("No OpenAI key provided — falling back to mock generation");
    return generateMemesMock();
  }

  const templateList = templates
    .map((t) => `- ${t.id}: ${t.name}`)
    .join("\n");

  const system = `You are a helpful assistant that selects the best meme template for a given topic and writes a short, funny meme caption (1-2 short sentences). Respond with a JSON array of objects with keys: templateId, caption. Example: [{"templateId":"t1","caption":"..."}]`;

  const user = `Topic:\nTitle: ${topic.title}\nDescription: ${topic.description}\n\nTemplates:\n${templateList}\n\nReturn exactly one object (inside a JSON array) with the best templateId and a concise caption. Keep the caption short and humorous.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    const body = await res.json();
    const assistant = body?.choices?.[0]?.message?.content ?? "";
    const parsed = tryExtractJSON(assistant);

    const arr = Array.isArray(parsed) ? parsed : [parsed];

    const memes: Meme[] = arr.map((it: any) => {
      const template = templates.find((t) => t.id === it.templateId);
      return {
        id: crypto.randomUUID(),
        templateId: it.templateId ?? template?.id ?? "",
        caption: String(it.caption ?? ""),
        imageUrl: template?.imageUrl ?? "",
        source: "ai",
      } as Meme;
    });

    return memes;
  } catch (err) {
    console.error("generateMemesAI error:", err);
    return generateMemesMock();
  }
}

export async function askAIForHelp(
  meme: Meme,
  topic: Topic | null,
  question: string,
  apiKey?: string
): Promise<{ suggestion: string; explanation?: string } | null> {
  const key = apiKey ?? (import.meta.env.VITE_OPENAI_KEY as string | undefined);
  if (!key) throw new Error("OpenAI API key is required");

  const system = `You are an assistant that helps improve meme captions. Given the original meme caption and topic, provide a short suggested improved caption and a one-line explanation in JSON: {"suggestion":"...","explanation":"..."}`;

  const user = `Topic: ${topic?.title ?? ""}\nDescription: ${topic?.description ?? ""}\n\nOriginal caption: ${meme.caption}\n\nUser question: ${question}\n\nReturn only a JSON object.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    const body = await res.json();
    const assistant = body?.choices?.[0]?.message?.content ?? "";

    const parsed = tryExtractJSON(assistant);
    return {
      suggestion: String(parsed.suggestion ?? parsed.suggestedCaption ?? parsed.caption ?? parsed?.suggestion ?? ""),
      explanation: String(parsed.explanation ?? ""),
    };
  } catch (err) {
    console.error("askAIForHelp error:", err);
    return null;
  }
}
