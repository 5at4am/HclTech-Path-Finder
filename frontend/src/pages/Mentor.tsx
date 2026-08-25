import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Why is this course next?",
  "Can I skip this?",
  "What should I learn today?",
  "Am I on track?",
  "What should I learn before this?",
];

export default function Mentor() {
  const { learnerId } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!learnerId) navigate("/onboarding"); }, [learnerId, navigate]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const history = useQuery({
    queryKey: ["mentor-history", learnerId],
    queryFn: () => api.mentorHistory(learnerId!),
    enabled: !!learnerId,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (history.data && !hydrated) {
      setMessages(history.data.map((h) => ({ role: h.role, content: h.message })));
      setHydrated(true);
    }
  }, [history.data, hydrated]);

  const chat = useMutation({
    mutationFn: (message: string) => api.mentorChat(learnerId!, message),
    onSuccess: (res) => setMessages((m) => [...m, { role: "assistant", content: res.message }]),
    onError: () => setMessages((m) => [...m, { role: "assistant", content: "I couldn't reach your learning data just now — try refreshing the page." }]),
  });

  function send(text: string) {
    const t = text.trim();
    if (!t || chat.isPending) return;
    setMessages((m) => [...m, { role: "user", content: t }]);
    setInput("");
    chat.mutate(t);
  }

  if (!learnerId) return null;

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight"><Sparkles size={20} className="text-accent" /> AI Mentor</h1>
        <p className="text-secondary">Contextual answers grounded in your actual path and progress.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-panel border border-border bg-surface p-4">
        {hydrated && messages.length === 0 && (
          <div className="rounded-card border border-dashed border-border bg-elevated p-6 text-center">
            <Sparkles size={22} className="mx-auto text-accent" aria-hidden />
            <p className="mt-2 text-sm font-medium text-primary">Ask me anything about your path</p>
            <p className="mt-1 text-xs text-secondary">Answers come from your actual courses, progress, and prerequisites.</p>
          </div>
        )}
        {!hydrated && history.isLoading && (
          <div className="flex justify-start"><div className="rounded-card rounded-bl-sm bg-elevated px-4 py-3 text-sm text-muted"><Loader2 className="inline animate-spin" /> loading conversation…</div></div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={`max-w-[80%] rounded-card px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-sm bg-accent text-white" : "rounded-bl-sm bg-elevated text-primary"}`}>
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {chat.isPending && (
          <div className="flex justify-start">
            <div className="rounded-card rounded-bl-sm bg-elevated px-4 py-3.5" role="status" aria-label="Mentor is thinking">
              <span className="flex items-end gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-secondary"
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="pill hover:border-accent-soft hover:text-primary">{s}</button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Astrolabe…" className="input" />
        <button type="submit" disabled={chat.isPending || !input.trim()} className="btn-primary disabled:opacity-40"><Send size={16} /></button>
      </form>
    </div>
  );
}
