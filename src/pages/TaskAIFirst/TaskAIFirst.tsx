import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Stack } from "@mui/material";
import { useSession } from "../../app/session/SessionContext";
import type { Meme } from "../../app/session/types";
import { generateMemesAI, askAIForHelp } from "../../services/meme";
import TemplateSelector, { type MemeTemplate } from "../../Components/Templates/TemplateSelector";
import baby from "../../assets/templates/baby.jpg";
import boromir from "../../assets/templates/boromir.jpg";
import choice from "../../assets/templates/choice.jpg";
import doge from "../../assets/templates/doge.jpg";
import "./TaskAIFirst.css";

const TOPIC_SECONDS = 60;

type PresetState = {
  id: string;
  title: string;
  description: string;
  templates: MemeTemplate[];
  meme?: Meme | null;
  initialAIMeme?: Meme | null;
  secondsLeft: number;
  completed: boolean;
};

export default function TaskAIFirst() {
  const nav = useNavigate();
  const { topic, templates, memes, setMemes, setTopic, setTemplates } = useSession();

  const PRESET_TOPICS = [
    {
      id: "school",
      title: "School",
      description: "Something relatable about school life.",
      templates: [
        { id: "s1", title: "Baby", imageUrl: baby },
        { id: "s2", title: "Boromir", imageUrl: boromir },
      ],
    },
    {
      id: "work",
      title: "Work / Office",
      description: "Relatable office vibes.",
      templates: [
        { id: "w1", title: "Choice", imageUrl: choice },
        { id: "w2", title: "Doge", imageUrl: doge },
      ],
    },
    {
      id: "football",
      title: "Playing Football",
      description: "A meme about football situations.",
      templates: [
        { id: "f1", title: "Doge", imageUrl: doge },
        { id: "f2", title: "Choice", imageUrl: choice },
      ],
    },
  ];

  function fillSample() {
    // set the first preset by default
    const t = PRESET_TOPICS[0];
    setTopic({ id: t.id, title: t.title, description: t.description });
    // Convert local preset shape into app Template shape
    setTemplates(t.templates.map((tt) => ({ id: tt.id, name: tt.title, imageUrl: tt.imageUrl })));
  }

  async function generateForPreset(presetIndex: number) {
    const p = PRESET_TOPICS[presetIndex];
    if (!p) return;
    setTopic({ id: p.id, title: p.title, description: p.description });
    const mapped = p.templates;
    const mappedTemplates = mapped.map((tt) => ({ id: tt.id, name: tt.title, imageUrl: tt.imageUrl }));
    setTemplates(mappedTemplates);

    setLoading(true);
    setError(null);
    try {
      const generated = await generateMemesAI({ id: p.id, title: p.title, description: p.description }, mappedTemplates);

      if (!generated || generated.length === 0) {
        setError("AI returned no memes. Try again or use sample data.");
        setPresetStates((prev) => prev.map((s, idx) => (idx === presetIndex ? { ...s, meme: null } : s)));
        setLocalMemes([]);
        setMemes([]);
      } else {
        const first = generated[0];
        setPresetStates((prev) => prev.map((s, idx) => (idx === presetIndex ? { ...s, meme: first, initialAIMeme: first, secondsLeft: TOPIC_SECONDS } : s)));
        setLocalMemes([first]);
        setMemes([first]);
        setSelectedIndex(0);
      }
    } catch (err: unknown) {
      setError(String((err as Error)?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // active topic index (walks through PRESET_TOPICS)
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  // Per-preset topic state
  const [presetStates, setPresetStates] = useState<PresetState[]>(() =>
    PRESET_TOPICS.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      templates: p.templates as MemeTemplate[],
      meme: null,
      initialAIMeme: null,
      secondsLeft: TOPIC_SECONDS,
      completed: false,
    }))
  );

  // Current topic's local meme (single meme per topic)
  const [localMemes, setLocalMemes] = useState<Meme[]>(memes ?? []);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [lastSuggestion, setLastSuggestion] = useState<string | null>(null);

  useEffect(() => setLocalMemes(memes ?? []), [memes]);

  function formatSeconds(s: number) {
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  // auto-generate first topic on mount
  useEffect(() => {
    generateForPreset(0).catch((e) => console.warn(e));
    setActiveTopicIndex(0);
  }, []);

  // timer for active topic
  useEffect(() => {
    const id = setInterval(() => {
      setPresetStates((prev) => prev.map((s, idx) => (idx === activeTopicIndex ? { ...s, secondsLeft: Math.max(0, s.secondsLeft - 1) } : s)));
    }, 1000);
    return () => clearInterval(id);
  }, [activeTopicIndex]);

  // when seconds reach 0, show message
  useEffect(() => {
    const cur = presetStates[activeTopicIndex];
    if (!cur) return;
    if (cur.secondsLeft === 0) {
      setError("Time's up for this topic. Finalize or press Reset to AI to change before continuing.");
    }
  }, [presetStates, activeTopicIndex]);


  async function handleGenerate() {
    setError(null);

    // Validate prerequisites
    if (!topic) {
      setError("No topic selected. Click 'Use sample data' or select a topic before generating.");
      return;
    }
    if (!templates || templates.length === 0) {
      setError("No templates available. Click 'Use sample data' or select templates before generating.");
      return;
    }

    setLoading(true);
    try {
      const generated = await generateMemesAI(topic, templates);


      if (!generated || generated.length === 0) {
        setError("AI returned no memes. Try again or use sample data.");
        setLocalMemes([]);
        setMemes([]);
      } else {
        setLocalMemes(generated);
        setMemes(generated);
        setSelectedIndex(0);
      }
    } catch (err: unknown) {
      setError(String((err as Error)?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  async function handleAskAI(index: number, question: string) {
    setError(null);
    setLastSuggestion(null);
    try {
      const m = localMemes[index];
      const res = await askAIForHelp(m, topic, question);
      if (res?.suggestion) {
        setLastSuggestion(res.suggestion);
      } else {
        setError("No suggestion returned from AI");
      }
    } catch (err: unknown) {
      setError(String((err as Error)?.message ?? err));
    }
  }

  function updateCaption(i: number, v: string) {
    const next = [...localMemes];
    next[i] = { ...next[i], caption: v, source: "human" };
    setLocalMemes(next);
    setMemes(next);
  }

  function selectTemplateForMeme(i: number, templateId: string) {
    const tmpl = templates?.find((t) => t.id === templateId);
    if (!tmpl) return;
    const next = [...localMemes];
    next[i] = { ...next[i], templateId: templateId, imageUrl: tmpl.imageUrl, source: "human" };
    setLocalMemes(next);
    setMemes(next);
  }

  function finalizeCurrentTopic() {
    const curIdx = activeTopicIndex;
    const final = localMemes[0];
    // save to preset state
    setPresetStates((prev) => prev.map((s, idx) => (idx === curIdx ? { ...s, meme: final, completed: true } : s)));

    // proceed to next topic or finish
    const nextIdx = curIdx + 1;
    if (nextIdx < PRESET_TOPICS.length) {
      setActiveTopicIndex(nextIdx);
      const nextPreset = PRESET_TOPICS[nextIdx];
      setTopic({ id: nextPreset.id, title: nextPreset.title, description: nextPreset.description });
      setTemplates(nextPreset.templates.map((t) => ({ id: t.id, name: t.title, imageUrl: t.imageUrl })));
      // generate next if not already generated
      const nextState = presetStates[nextIdx];
      if (!nextState?.meme) {
        generateForPreset(nextIdx).catch((e) => console.warn(e));
      } else {
        setLocalMemes(nextState.meme ? [nextState.meme] : []);
        setMemes(nextState.meme ? [nextState.meme] : []);
        setSelectedIndex(0);
      }
    } else {
      // all done - collect memes and go to review
      const all = presetStates.map((s) => s.meme).filter(Boolean) as Meme[];
      setMemes(all);
      nav('/review');
    }
  }

  return (
    <div className="ai-page">
      <header className="ai-header">
        <h1>Task – AI First</h1>
        <p className="preamble">AI selects a template and generates one meme per topic. You may refine or ask for AI assistance before submitting.</p>
      </header>

      <section>
        <div className="controls">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRESET_TOPICS.map((p, i) => (
                <button key={p.id} className="btn btn-ghost" onClick={() => generateForPreset(i)}>{p.title}</button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" disabled={loading} onClick={handleGenerate}>{loading ? "Generating..." : "Generate AI Meme"}</button>
              <button className="btn btn-secondary" onClick={fillSample}>Use sample data</button>
            </div>
          </div>

          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <p className="small-muted">Topic: {topic ? topic.title : <em>None selected</em>} • Templates: {templates?.length ?? 0}</p>
            <div style={{ marginLeft: 'auto', minWidth: 160, textAlign: 'right' }}>
              {presetStates[activeTopicIndex] && (
                <>
                  <div className="small-muted">Time left: {formatSeconds(presetStates[activeTopicIndex].secondsLeft)}</div>
                  <div className="timer-bar" aria-hidden>
                    <div className="timer-fill" style={{ width: `${(presetStates[activeTopicIndex].secondsLeft / TOPIC_SECONDS) * 100}%` }} />
                  </div>
                </>
              )}
            </div>
          </div>

          {error && <p className="error">{error}</p>}
        </div>
      </section>

      <div className="three-col">
        <aside className="left-col">
          <div className="controls">
            <button className="btn btn-primary" disabled={loading} onClick={handleGenerate}>{loading ? "Generating..." : "Generate AI Meme"}</button>
            <button className="btn btn-secondary" onClick={fillSample}>Use sample data</button>
          </div>
          {error && <p className="error">{error}</p>}

          <div className="ai-list">
            {presetStates.map((s, idx) => (
              <button key={s.id} className={`ai-list-item ${idx === activeTopicIndex ? 'selected' : ''}`} onClick={() => { setActiveTopicIndex(idx); setLocalMemes(s.meme ? [s.meme] : []); setMemes(s.meme ? [s.meme] : []); setSelectedIndex(0); }}>
                <img src={s.meme?.imageUrl || "https://via.placeholder.com/120"} alt="thumb" className="thumb" />
                <div className="meta">
                  <div className="template">{s.title}</div>
                  <div className="preview">{s.meme ? s.meme.caption : <em>No meme yet</em>}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="mid-col">
          <div className="chat-card">
            <h3>Ask AI for help</h3>
            <p className="small-muted">Enter a short instruction for the AI to improve the selected caption.</p>

            <ChatPanel onAsk={async (q) => handleAskAI(selectedIndex, q)} lastSuggestion={lastSuggestion} onApply={() => { if (lastSuggestion) { const next=[...localMemes]; next[selectedIndex]={...next[selectedIndex],caption:lastSuggestion, source: 'ai'}; setLocalMemes(next); setMemes(next); setLastSuggestion(null);} }} />
          </div>
        </section>

        <aside className="right-col">
          <div className="editor-card">
            <h3>Edit caption</h3>
            {!localMemes[selectedIndex] && <p className="small-muted">Select an AI meme from the left to edit.</p>}

            {localMemes[selectedIndex] && (
              <div>
                {/* Template selector to allow changing the image/template */}
                {templates && templates.length > 0 ? (
                  <div style={{ marginBottom: 12 }}>
                    <label className="small-label">Template</label>
                    <TemplateSelector
                      templates={templates.map((t) => ({ id: t.id, title: t.name, imageUrl: t.imageUrl })) as MemeTemplate[]}
                      selectedId={localMemes[selectedIndex].templateId ?? null}
                      onSelect={(id) => selectTemplateForMeme(selectedIndex, id)}
                    />
                  </div>
                ) : (
                  <p className="small-muted">No templates available. Click "Use sample data".</p>
                )}

                <img src={(localMemes[selectedIndex].imageUrl) || "https://via.placeholder.com/300"} alt="selected" style={{ width: "100%", borderRadius: 8, marginBottom: 12 }} />

                <label className="small-label">Caption</label>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField variant="outlined" multiline minRows={3} value={localMemes[selectedIndex].caption} onChange={(e) => updateCaption(selectedIndex, e.target.value)} />

                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                    <Button variant="outlined" onClick={() => {
                      const curState = presetStates[activeTopicIndex];
                      if (curState?.initialAIMeme) {
                        const next = [...localMemes];
                        next[0] = { ...curState.initialAIMeme };
                        setLocalMemes(next);
                        setMemes(next);
                      }
                    }}>Reset to AI</Button>
                    <Button variant="contained" color="primary" onClick={() => finalizeCurrentTopic()}>Finalize & Continue</Button>
                  </Stack>
                </Box>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ChatPanel({ onAsk, lastSuggestion, onApply }: { onAsk: (q: string) => Promise<void>; lastSuggestion: string | null; onApply: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input-text" placeholder="e.g., make it edgier" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-ghost" disabled={loading || q.trim().length === 0} onClick={async () => { setLoading(true); try { await onAsk(q.trim()); setQ(''); } finally { setLoading(false); } }}>{loading ? 'Asking…' : 'Ask'}</button>
      </div>

      {lastSuggestion && (
        <div style={{ marginTop: 12, padding: 12, background: 'linear-gradient(180deg,#fff,#fbfdff)', borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Suggestion</div>
          <div style={{ color: 'var(--muted)' }}>{lastSuggestion}</div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={onApply}>Apply suggestion</button>
          </div>
        </div>
      )}
    </div>
  );
}
