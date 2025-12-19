import { useNavigate } from "react-router-dom";
import { useSession } from "../../app/session/SessionContext";

export default function Consent() {
  const nav = useNavigate();
  const { setConsented, setCondition } = useSession();

  return (
    <div>
      <h1>Consent</h1>
      <p>By continuing you agree to participate…</p>

      <button
        onClick={() => {
          setConsented(true);

          // Randomly assign condition (or let researcher choose)
          const c = Math.random() < 0.5 ? "human-first" : "ai-first";
          setCondition(c);

          nav(c === "human-first" ? "/intro/human" : "/intro/ai");
        }}
      >
        I consent and continue
      </button>
    </div>
  );
}
