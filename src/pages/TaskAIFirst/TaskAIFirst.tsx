import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../app/session/SessionContext";
import type { Meme } from "../../app/session/types";
import { generateMemesAI, askAIForHelp } from "../../services/meme";
import "./TaskAIFirst.css";

export default function TaskAIFirst() {
  const nav = useNavigate();
  const { topic, templates, memes, setMemes, setTopic, setTemplates } = useSession();

  function fillSample() {
    setTopic({ id: "sample-topic", title: "Work-from-home struggles", description: "Jokes about remote work and Zoom meetings" });
    setTemplates([
      { id: "t1", name: "Distracted Boyfriend", imageUrl: "/templates/t1.png" },
      { id: "t2", name: "Drake", imageUrl: "/templates/t2.png" },
    ]);
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMemes, setLocalMemes] = useState<Meme[]>(memes ?? []);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [lastSuggestion, setLastSuggestion] = useState<string | null>(null);

  useEffect(() => setLocalMemes(memes ?? []), [memes]);

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
    } catch (err: any) {
      setError(err?.message ?? String(err));
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
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  }

  function updateCaption(i: number, v: string) {
    const next = [...localMemes];
    next[i] = { ...next[i], caption: v, source: "human" };
    setLocalMemes(next);
    setMemes(next);
  }

  return (
    <div className="ai-page">
      <header className="ai-header">
        <h1>Task – AI First</h1>
        <p className="preamble">AI selects a template and generates one meme per topic. You may refine or ask for AI assistance before submitting.</p>
      </header>

      <section>
        <div className="controls">


          <button className="btn btn-primary" disabled={loading} onClick={handleGenerate}>{loading ? "Generating..." : "Generate AI Meme"}</button>
          <button className="btn btn-secondary" onClick={fillSample}>Use sample data</button>
        </div>

        <div style={{ marginTop: 8 }}>
          <p className="small-muted">Topic: {topic ? topic.title : <em>None selected</em>} • Templates: {templates?.length ?? 0}</p>
        </div>

        {error && <p className="error">{error}</p>}
      </section>

      <div className="three-col">
        <aside className="left-col">
          <div className="controls">
            <button className="btn btn-primary" disabled={loading} onClick={handleGenerate}>{loading ? "Generating..." : "Generate AI Meme"}</button>
            <button className="btn btn-secondary" onClick={fillSample}>Use sample data</button>
          </div>
          {error && <p className="error">{error}</p>}

          <div className="ai-list">
            {localMemes.length === 0 && <p className="small-muted">(No AI memes yet)</p>}
            {localMemes.map((m, i) => (
              <button key={m.id} className={`ai-list-item ${i === selectedIndex ? 'selected' : ''}`} onClick={() => setSelectedIndex(i)}>
                <img src={m.imageUrl || "https://via.placeholder.com/120"} alt="thumb" className="thumb" />
                <div className="meta">
                  <div className="template">{m.templateId}</div>
                  <div className="preview">{m.caption}</div>
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
                <img src={localMemes[selectedIndex].imageUrl || "https://via.placeholder.com/300"} alt="selected" style={{ width: "100%", borderRadius: 8, marginBottom: 12 }} />
                <label className="small-label">Caption</label>
                <textarea value={localMemes[selectedIndex].caption} onChange={(e) => updateCaption(selectedIndex, e.target.value)} className="input-text" style={{ minHeight: 80 }} />

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn btn-outline" onClick={() => { /* revert? later */ }}>Revert</button>
                  <button className="btn btn-primary" onClick={() => nav('/review')}>Finalize & Continue</button>
                </div>
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
