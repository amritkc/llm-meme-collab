import { useNavigate } from "react-router-dom";
import "../Intro/Intro.css";

export default function IntroHuman() {
  const nav = useNavigate();

  return (
    <div>
      <section className="intro-hero">
        <img src="/src/assets/logo.svg" alt="MemeCollab" />
        <div className="intro-hero-content">
          <h1>Human-First Task</h1>
          <div className="intro-hero-sub">You'll create three original caption ideas for the provided topic and select templates to match your humor.</div>
        </div>
      </section>

      <div className="intro-card">
        <h2>What to expect</h2>
        <div className="steps">
          <div className="step">
            <h3>Read the topic</h3>
            <p>Each topic includes a short title and description to inspire your captions.</p>
          </div>
          <div className="step">
            <h3>Create captions</h3>
            <p>Propose three different captions — be concise and aim for humor or relatability.</p>
          </div>
          <div className="step">
            <h3>Refine & submit</h3>
            <p>Review your captions, select templates, and continue to rating the final memes.</p>
          </div>
        </div>

        <div className="cta-row">
          <button className="btn-outline" onClick={() => nav('/task/ai-first')}>Switch to AI-first</button>
          <button className="btn-primary" onClick={() => nav('/task/human-first')}>Start Human Task</button>
        </div>
      </div>
    </div>
  );
}
