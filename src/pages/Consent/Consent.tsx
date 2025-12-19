import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../app/session/SessionContext";
<<<<<<< Updated upstream
=======
import "./Consent.css";
>>>>>>> Stashed changes

export default function Consent() {
  const nav = useNavigate();
  const { setConsented, setCondition } = useSession();
  const [checked, setChecked] = useState(false);
  const [declined, setDeclined] = useState(false);

  function accept() {
    if (!checked) return;
    setConsented(true);
    const c = Math.random() < 0.5 ? "human-first" : "ai-first";
    setCondition(c);
    nav(c === "human-first" ? "/intro/human" : "/intro/ai");
  }

  function decline() {
    setDeclined(true);
  }

  return (
    <div className="consent-page">
      <div className="consent-left">
        <div className="consent-hero">
          <div className="consent-icon">
            <img src="/src/assets/checkmark.svg" alt="Checkmark" style={{ width: 40, height: 40 }} />
          </div>
          <div>
            <h2 className="consent-title">Research Participation Consent</h2>
            <div className="consent-sub">Please read the details and provide your consent to continue.</div>
          </div>
        </div>

        <div className="consent-body">
          <p>
            You are invited to participate in a research study exploring how humans and AI collaborate to produce humorous, relatable memes. Participation is entirely voluntary and you may withdraw at any time without penalty.
          </p>

          <ul className="consent-list">
            <li>Tasks: create/edit short meme captions and rate memes.</li>
            <li>Data: anonymized responses and interaction logs will be collected for analysis.</li>
            <li>Duration: approx. 10–15 minutes.</li>
          </ul>

          <p className="consent-note">To proceed, check the box below and click <strong>"I consent and continue"</strong>. Declining will exit the study.</p>

          <div className="consent-accept">
            <label className="checkbox">
              <input aria-label="consent checkbox" type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
              <span className="small-muted">I have read and agree to participate.</span>
            </label>

            <div>
              <button aria-disabled={!checked} className="btn-accept" onClick={accept} disabled={!checked}>I consent and continue</button>
              <button className="btn-decline" onClick={decline} style={{ marginLeft: 8 }}>Decline</button>
            </div>
          </div>

          {declined && (
            <p className="small-muted" style={{ marginTop: 12 }}>You have declined to participate. Visit the <a href="/contact">Contact</a> page for more information.</p>
          )}
        </div>
      </div>

      <aside className="consent-side" aria-hidden>
        <div className="consent-illustration">
          <svg width="220" height="180" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="220" height="180" rx="12" fill="#f6fbff" />
            <g transform="translate(16,20)" fill="none" stroke="var(--brand-blue-dark)" stroke-width="2">
              <rect x="0" y="0" width="188" height="120" rx="8" fill="#fff" stroke-opacity="0.06" />
              <circle cx="30" cy="36" r="18" fill="url(#g)" stroke="none" />
            </g>
            <defs>
              <linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#062d6b"/><stop offset="1" stop-color="#2d82ff"/></linearGradient>
            </defs>
          </svg>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
          <strong>Privacy</strong>
          <div style={{ marginTop: 8 }}>Your data is stored securely and only used for research purposes. No personally identifying information is published.</div>
        </div>
      </aside>
    </div>
  );
}
