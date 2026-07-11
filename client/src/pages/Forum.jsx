import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none";

const timeAgo = (date) => {
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days === 0) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

// Interactive 1-5 star strip.
function Stars({ value, onRate, my }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={my ? `You rated ${my}★` : "Rate this topic"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onRate(n)}
          className={`text-sm ${n <= (my ?? Math.round(value ?? 0)) ? "text-amber-400" : "text-slate-300"} hover:scale-125 transition-transform`}>
          ★
        </button>
      ))}
    </span>
  );
}

function PostCard({ post, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const act = async (path, body) => {
    setBusy(true);
    try {
      const data = await api(`/api/forum/${post.id}/${path}`, { method: "POST", body });
      onChanged(data.post);
    } catch { /* ignore double-clicks */ }
    finally { setBusy(false); }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await act("comments", { text: comment });
    setComment("");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Upvote column */}
        <button onClick={() => act("upvote")} disabled={busy}
          className={`flex flex-col items-center rounded-lg px-2 py-1 text-sm ${
            post.upvotedByMe ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"
          }`}>
          ▲<span className="font-semibold">{post.upvoteCount}</span>
        </button>

        <div className="min-w-0 flex-1">
          <button onClick={() => setExpanded(!expanded)} className="text-left">
            <h3 className="font-semibold text-slate-800 hover:text-indigo-700">{post.title}</h3>
          </button>
          <p className="mt-0.5 text-xs text-slate-400">
            {post.authorName} · {timeAgo(post.createdAt)}
            {post.city && <> · 📍 {post.city}</>}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700">
                #{t}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-2 text-xs text-slate-400">
              <Stars value={post.avgRating} my={post.myRating} onRate={(n) => act("rate", { stars: n })} />
              {post.avgRating != null && <span>{post.avgRating} ({post.ratingCount})</span>}
              <span>💬 {post.comments.length}</span>
            </span>
          </div>

          {expanded && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{post.body}</p>

              {/* Comments */}
              <div className="mt-4 space-y-2">
                {post.comments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">{c.authorName}</span>{" "}
                    <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                    <p className="text-slate-600">{c.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={sendComment} className="mt-3 flex gap-2">
                <input value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a reply…" className={inputClass} />
                <button type="submit" disabled={busy || !comment.trim()}
                  className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  Reply
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewPostForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", tags: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/forum", { method: "POST", body: form });
      setForm({ title: "", body: "", tags: "", city: "" });
      setOpen(false);
      onCreated(data.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-3 text-left text-slate-400 hover:border-indigo-400 hover:text-indigo-500">
        ✍️ Share your experience or ask the community…
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <input value={form.title} required maxLength={150} placeholder="Title"
        onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
      <textarea value={form.body} required rows={4} maxLength={5000}
        placeholder="Your experience, question, or advice…"
        onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputClass} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={form.tags} placeholder="Tags, comma-separated (visa, housing)"
          onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputClass} />
        <input value={form.city} placeholder="City (optional)"
          onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy}
          className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {busy ? "Posting…" : "Post"}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-600 hover:bg-slate-200">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Forum() {
  const [posts, setPosts] = useState(null);
  const [filters, setFilters] = useState({ tag: "", sort: "new" });
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.tag) params.set("tag", filters.tag);
    params.set("sort", filters.sort);
    api(`/api/forum?${params}`)
      .then((d) => setPosts(d.posts))
      .catch((err) => setError(err.message));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // Update one post in place after an interaction (no full reload).
  const patch = (updated) =>
    setPosts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));

  const allTags = [...new Set((posts ?? []).flatMap((p) => p.tags))].slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🗣️ Community Forum</h1>
          <p className="mt-1 text-slate-500">Real experiences from students on the same journey.</p>
        </div>
        <Link to="/forum/insights"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          📊 Insights Dashboard
        </Link>
      </div>

      <div className="mt-6">
        <NewPostForm onCreated={(p) => setPosts([p, ...(posts ?? [])])} />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setFilters({ ...filters, tag: "" })}
          className={`rounded-full px-3 py-1 text-sm ${!filters.tag ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>
          all
        </button>
        {allTags.map((t) => (
          <button key={t} onClick={() => setFilters({ ...filters, tag: t })}
            className={`rounded-full px-3 py-1 text-sm ${filters.tag === t ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>
            #{t}
          </button>
        ))}
        <select value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          className="ml-auto rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-600 focus:outline-none">
          <option value="new">Newest</option>
          <option value="top">Most upvoted</option>
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-4 space-y-3">
        {posts === null ? (
          <p className="py-10 text-center text-slate-400">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="py-10 text-center text-slate-400">No posts yet — start the conversation!</p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} onChanged={patch} />)
        )}
      </div>
    </div>
  );
}
