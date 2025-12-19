import { useNavigate } from "react-router-dom";
import "../Intro/Intro.css";

export default function IntroAI() {
  const nav = useNavigate();

  return (
    <div>
      <section className="intro-hero">
        <img src="/src/assets/logo.svg" alt="MemeCollab" />
        <div className="intro-hero-content">
          <h1>AI-First Task</h1>
          <div className="intro-hero-sub">You'll begin by reviewing an AI-generated meme and refining its caption – you can edit, ask the AI for help, and finalize your choice.</div>
        </div>
      </section>

      <div className="intro-card">
        <h2>What to expect</h2>
        <div className="steps">
          <div className="step">
            <h3>AI generates a meme</h3>
            <p>The system selects a template and proposes a concise caption tailored to the topic.</p>
          </div>
          <div className="step">
            <h3>Refine or edit</h3>
            <p>Edit the caption directly or ask the AI to suggest improvements using the chat tool.</p>
          </div>
          <div className="step">
            <h3>Submit your best</h3>
            <p>Finalize your improved caption and continue to rate the meme.</p>
          </div>
        </div>

        <div className="cta-row">
          <button className="btn-outline" onClick={() => nav('/task/human-first')}>Switch to Human-first</button>
          <button className="btn-primary" onClick={() => nav('/task/ai-first')}>Start AI Task</button>
        </div>
      </div>
    </div>
  );
}
