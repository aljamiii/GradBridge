import { useState } from "react";
import { api } from "../lib/api";

const SUGGESTIONS = [
  "How cold does Toronto get in winter?",
  "Is halal food easy to find in Berlin?",
  "Can I work part-time as a student in Melbourne?",
  "Is London safe at night?",
  "How do I find housing in Stockholm?",
];

// One Q&A exchange in the conversation.
function Exchange({ item }) {
  return (
    <div className="space-y-3">
      {/* Student's question */}
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
          {item.question}
        </div>
      </div>

      {/* Advisor's answer */}
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
          {item.loading ? (
            <p className="text-sm text-ink-400">🤖 Consulting the guides…</p>
          ) : item.error ? (
            <p className="text-sm text-red-600">{item.error}</p>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm text-ink-700">{item.answer}</p>

              {/* Live weather chip */}
              {item.weather && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700">
                  🌤 Live now in {item.weather.city}: {item.weather.tempC}°C
                  (feels {item.weather.feelsLikeC}°C), {item.weather.description}
                </div>
              )}

              {/* Retrieved sources — the proof this is RAG, not memory */}
              {item.sources?.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-2">
                  <span className="text-xs font-medium text-ink-400">
                    📚 Answered from:{" "}
                  </span>
                  {item.sources.map((s, i) => (
                    <span key={i}
                      className="mr-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-ink-500">
                      {s.city} · {s.topic} ({Math.round(s.similarity * 100)}%)
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DestinationAdvisor() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [busy, setBusy] = useState(false);

  const ask = async (q) => {
    const text = (q ?? question).trim();
    if (!text || busy) return;
    setQuestion("");
    setBusy(true);

    // Show the question immediately with a loading answer bubble.
    setConversation((c) => [...c, { question: text, loading: true }]);

    try {
      const history = conversation
        .filter((item) => !item.loading && !item.error && item.answer)
        .slice(-3)
        .map((item) => ({
          question: item.question,
          answer: item.answer,
        }));

      const data = await api("/api/ai/destination-advisor", {
        method: "POST",
        body: {
          question: text,
          history,
        },
      });
      setConversation((c) =>
        c.map((item, i) =>
          i === c.length - 1
            ? { question: text, answer: data.answer, sources: data.sources, weather: data.weather }
            : item
        )
      );
    } catch (err) {
      setConversation((c) =>
        c.map((item, i) =>
          i === c.length - 1 ? { question: text, error: err.message } : item
        )
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Destination Advisor</h1>
      <p className="mt-1 text-ink-500">
        Ask anything about living in your target city — answers come from curated
        guides for Bangladeshi students plus live weather data (RAG).
      </p>

      {/* Suggested questions to get started */}
      {conversation.length === 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => ask(s)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-brand-400 hover:text-brand-600">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Conversation */}
      <div className="mt-6 space-y-6">
        {conversation.map((item, i) => (
          <Exchange key={i} item={item} />
        ))}
      </div>

      {/* Ask box */}
      <form
        onSubmit={(e) => { e.preventDefault(); ask(); }}
        className="sticky bottom-4 mt-8 flex gap-2 glass-card rounded-2xl p-2 shadow-lg">
        <input value={question} onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., Are there mosques near KTH in Stockholm?"
          className="flex-1 rounded-lg px-3 py-2 text-ink-900 placeholder-slate-400 focus:outline-none" />
        <button type="submit" disabled={busy || !question.trim()}
          className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-[var(--shadow-brand)] transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50">
          {busy ? "…" : "Ask"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-ink-400">
        Guides currently cover: Toronto · London · Berlin · Melbourne · Kuala Lumpur · Stockholm
      </p>
    </div>
  );
}
