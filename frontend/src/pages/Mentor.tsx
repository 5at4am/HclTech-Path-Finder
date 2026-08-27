import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useDashboard, useMentorChat, useMentorHistory } from "../lib/hooks";
import { Button, Card, EmptyState, Input, PageHeader, Skeleton } from "../components/ui";
import { MentorMessage, MentorContextCard, MentorTyping } from "../components/product.panels";

interface Msg {
  role: "user" | "assistant";
  message: string;
  sources?: Record<string, unknown>[];
  evidence?: unknown;
}

export function Mentor() {
  const { learnerId, profile } = useLearner();
  const dash = useDashboard(learnerId);
  const history = useMentorHistory(learnerId);
  const chat = useMentorChat(learnerId);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history.data) {
      setMessages(
        history.data.map((h) => ({ role: h.role, message: h.message, sources: h.sources })),
      );
    }
  }, [history.data]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  if (!learnerId) return null;
  if (dash.isLoading) return <Skeleton className="h-96" />;

  const send = () => {
    const text = input.trim();
    if (!text || chat.isPending) return;
    setMessages((m) => [...m, { role: "user", message: text }]);
    setInput("");
    chat.mutate(text, {
      onSuccess: (res) => {
        setMessages((m) => [
          ...m,
          { role: "assistant", message: res.message, sources: res.sources, evidence: res.evidence },
        ]);
      },
      onError: (e) => {
        setMessages((m) => [
          ...m,
          { role: "assistant", message: `Sorry — ${e instanceof Error ? e.message : "something went wrong"}.` },
        ]);
      },
    });
  };

  const chips = ["Why this step next?", "Am I on track?", "What to do this week?", "Prereq for React?", "Can I skip this?"];

  return (
    <div>
      <PageHeader
        eyebrow="Mentor — Tera AI Guide"
        title="Contextual guidance"
        description="Short, pro bullets — grounded in your goal, path & evidence. No fluff."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="flex flex-col h-[62vh] min-h-[440px]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.length === 0 && (
              <div className="h-full grid place-items-center text-center p-6">
                <EmptyState
                  title="Start a conversation"
                  description="PadhAI answers in 2-4 short bullets — value first, no paragraphs."
                />
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {chips.map((c) => (
                    <button key={c} className="pill hover:border-brand hover:text-brand transition-colors text-caption" onClick={() => setInput(c)}>
                      <Sparkles size={12} /> {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <MentorMessage
                key={i}
                message={m.message}
                sources={m.sources}
                evidence={m.evidence as never}
                variant={m.role}
              />
            ))}
            {chat.isPending && <MentorTyping />}
            <div ref={endRef} />
          </div>
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 py-2 border-t border-default">
              {chips.slice(0, 4).map((c) => (
                <button key={c} className="pill text-caption hover:border-brand hover:text-brand" onClick={() => setInput(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="mt-1 flex gap-2 border-t border-default pt-3">
            <Input
              placeholder="Ask in Hinglish or English — e.g. Why is JS next?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              disabled={chat.isPending}
            />
            <Button onClick={send} disabled={chat.isPending || !input.trim()} aria-label="Send" loading={chat.isPending}>
              <Send size={16} />
            </Button>
          </div>
        </Card>

        <aside>
          <MentorContextCard
            goal={profile?.goal || dash.data?.goal}
            stepTitle={dash.data?.continue_resource?.title ?? null}
            progressPct={dash.data?.path_complete_pct}
          />
        </aside>
      </div>
    </div>
  );
}
