import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useDashboard, useMentorChat, useMentorHistory } from "../lib/hooks";
import { Button, Card, EmptyState, Input, PageHeader, Skeleton } from "../components/ui";
import { MentorMessage, MentorContextCard } from "../components/product.panels";

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

  return (
    <div>
      <PageHeader
        eyebrow="Mentor"
        title="Contextual guidance"
        description="Ask about your path. Responses stay grounded in your goal, progress, and the evidence base."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="flex flex-col h-[60vh] min-h-[420px]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.length === 0 && (
              <div className="h-full grid place-items-center text-center">
                <EmptyState
                  title="Start a conversation"
                  description="Try: “Why is this step next?” or “How do I close my React gap?”"
                />
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
            {chat.isPending && (
              <MentorMessage message="Thinking…" variant="assistant" />
            )}
            <div ref={endRef} />
          </div>
          <div className="mt-3 flex gap-2 border-t border-default pt-3">
            <Input
              placeholder="Ask your mentor…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <Button onClick={send} disabled={chat.isPending || !input.trim()} aria-label="Send">
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
