import React, { createContext, useContext, useMemo, useState } from "react";
import type { Condition, Meme, MemeRating, Template, Topic } from "./types";

type SessionState = {
  participantId: string;
  prolificPid: string | null;
  studyId: string | null;
  sessionId: string | null;
  consented: boolean;
  condition: Condition | null;

  topic: Topic | null;
  templates: Template[];
  captionIdeas: string[];

  memes: Meme[];
  ratings: MemeRating[];

  setConsented(v: boolean): void;
  setCondition(c: Condition): void;
  setTopic(t: Topic): void;
  setTemplates(t: Template[]): void;
  setCaptionIdeas(v: string[]): void;
  setMemes(v: Meme[]): void;
  addRating(r: MemeRating): void;
};

const SessionCtx = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [participantId] = useState(() => crypto.randomUUID());
  const [prolificPid] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('PROLIFIC_PID');
  });
  const [studyId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('STUDY_ID');
  });
  const [sessionId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('SESSION_ID');
  });
  const [consented, setConsented] = useState(false);
  const [condition, setCondition] = useState<Condition | null>(null);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [captionIdeas, setCaptionIdeas] = useState<string[]>([]);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [ratings, setRatings] = useState<MemeRating[]>([]);

  const value = useMemo<SessionState>(
    () => ({
      participantId,
      prolificPid,
      studyId,
      sessionId,
      consented,
      condition,
      topic,
      templates,
      captionIdeas,
      memes,
      ratings,
      setConsented,
      setCondition,
      setTopic,
      setTemplates,
      setCaptionIdeas,
      setMemes,
      addRating: (r) => setRatings((prev) => [...prev.filter(x => x.memeId !== r.memeId), r]),
    }),
    [participantId, prolificPid, studyId, sessionId, consented, condition, topic, templates, captionIdeas, memes, ratings]
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
