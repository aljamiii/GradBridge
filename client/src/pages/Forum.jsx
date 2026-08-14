import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import {
  Alert, Avatar, Badge, Button, Card, EmptyState, Input, Page, PageHeader, Skeleton, Textarea, cx,
} from "../components/ui";

const timeAgo = (date) => {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

/* ------------------------------------------------------------------ stars */

function Stars({ value, my, onRate, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const shown = hover || my || Math.round(value ?? 0);
  return (
    <span className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHover(0)}
      title={my ? `You rated ${my} of 5` : "Rate this post"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onClick={() => !readOnly && onRate(n)}
          aria-label={`Rate ${n} of 5`}
          className={cx("transition-transform", !readOnly && "hover:scale-125")}>
          <Icon name="star" className={cx("h-3.5 w-3.5",
            n <= shown ? "fill-amber-400 text-amber-400" : "text-slate-300")} strokeWidth={1.5} />
        </button>
      ))}
    </span>
  );
}

/* --------------------------------------------------------------- post card */

function PostCard({ post, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const act = async (path, body) => {
    setBusy(true);
    try {
      const d = await api(`/api/forum/${post.id}/${path}`, { method: "POST", body });
      onChanged(d.post);
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
    <Card className="!p-0">
      <div className="flex gap-4 p-5">
        {/* vote rail */}
        <button onClick={() => act("upvote")} disabled={busy}
          aria-pressed={post.upvotedByMe}
          className={cx(
            "flex h-fit shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 transition-colors",
            post.upvotedByMe
              ? "bg-brand-500/12 text-brand-600 ring-1 ring-brand-500/20"
              : "text-ink-400 hover:bg-white/70 hover:text-brand-600"
          )}>
          <Icon name="trendingUp" className="h-4 w-4" strokeWidth={2.2} />
          <span className="text-sm font-bold tabular-nums">{post.upvoteCount}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2.5">
            <Avatar name={post.authorName} size="sm" />
            <div className="min-w-0">
              <p className="text-xs text-ink-400">
                <span className="font-semibold text-ink-700">{post.authorName}</span>
                {" · "}{timeAgo(post.createdAt)}
                {post.city && (
                  <> · <span className="inline-flex items-center gap-0.5">
                    <Icon name="location" className="h-3 w-3" />{post.city}
                  </span></>
                )}
              </p>
            </div>
          </div>

          <button onClick={() => setExpanded((v) => !v)}
            className="mt-2 block text-left">
            <h3 className="font-bold leading-snug text-ink-900 transition-colors hover:text-brand-700">
              {post.title}
            </h3>
          </button>

          {!expanded && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">{post.body}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {post.tags.map((t) => (
              <Badge key={t} tone="brand">#{t}</Badge>
            ))}
            <span className="ml-auto flex items-center gap-3 text-xs text-ink-400">
              <span className="flex items-center gap-1.5">
                <Stars value={post.avgRating} my={post.myRating}
                  onRate={(n) => act("rate", { stars: n })} />
                {post.avgRating != null && (
                  <span className="tabular-nums">{post.avgRating} ({post.ratingCount})</span>
                )}
              </span>
              <button onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 transition-colors hover:text-brand-600">
                <Icon name="message" className="h-3.5 w-3.5" />
                {post.comments.length}
              </button>
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="animate-rise border-t border-white/60 px-5 pb-5 pt-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{post.body}</p>

          {post.comments.length > 0 && (
            <div className="mt-5 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">
                {post.comments.length} {post.comments.length === 1 ? "reply" : "replies"}
              </p>
              {post.comments.map((c) => (
                <div key={c.id} className="glass-inset flex gap-2.5 rounded-xl p-3">
                  <Avatar name={c.authorName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs text-ink-400">
                      <span className="font-semibold text-ink-700">{c.authorName}</span>
                      {" · "}{timeAgo(c.createdAt)}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-700">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={sendComment} className="mt-4 flex gap-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Share what you know…" className="flex-1" />
            <Button type="submit" disabled={busy || !comment.trim()} className="shrink-0">
              Reply
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- composer */

function Composer({ onCreated }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", tags: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await api("/api/forum", { method: "POST", body: form });
      setForm({ title: "", body: "", tags: "", city: "" });
      setOpen(false);
      onCreated(d.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Card className="!p-3">
        <button onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/60">
          <Avatar name={user.name} size="sm" />
          <span className="text-sm text-ink-400">
            Share an experience, or ask the community…
          </span>
          <Icon name="chevronRight" className="ml-auto h-4 w-4 text-ink-400" />
        </button>
      </Card>
    );
  }

  return (
    <Card as="form" onSubmit={submit} className="animate-rise space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <Input value={form.title} required maxLength={150} placeholder="What's your question or experience?"
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="!text-base !font-semibold" />
      <Textarea value={form.body} required rows={5} maxLength={5000}
        placeholder="Give enough detail that someone can actually act on it — dates, amounts, what you'd do differently…"
        onChange={(e) => setForm({ ...form, body: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={form.tags} placeholder="Tags: visa, housing, funding"
          onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <Input value={form.city} placeholder="City (optional)"
          onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={busy}>{busy ? "Posting…" : "Post to forum"}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------- page */

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

  // Tag counts drive the sidebar; computed from whatever is loaded.
  const tagCounts = useMemo(() => {
    const counts = new Map();
    for (const p of posts ?? []) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [posts]);

  return (
    <Page width="6xl">
      <PageHeader
        eyebrow="Module 3 · Community"
        title="Community Forum"
        description="Real experiences from students on the same journey — upvote what helped, rate what's accurate."
        actions={
          <Button to="/forum/insights" variant="secondary">
            <Icon name="chart" className="h-4 w-4" /> Insights
          </Button>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        {/* -------------------------------------------------------- feed */}
        <div className="space-y-4 lg:col-span-3">
          <Composer onCreated={(p) => setPosts([p, ...(posts ?? [])])} />

          {/* sort bar */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-xl bg-white/50 p-1 backdrop-blur-sm ring-1 ring-white/60">
              {[
                { id: "new", label: "Newest" },
                { id: "top", label: "Most upvoted" },
              ].map((s) => (
                <button key={s.id} onClick={() => setFilters({ ...filters, sort: s.id })}
                  className={cx("rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    filters.sort === s.id ? "bg-white text-brand-700 shadow-sm" : "text-ink-400 hover:text-ink-700")}>
                  {s.label}
                </button>
              ))}
            </div>
            {filters.tag && (
              <button onClick={() => setFilters({ ...filters, tag: "" })}
                className="flex items-center gap-1.5 rounded-full bg-brand-500/12 px-3 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-500/20">
                #{filters.tag}
                <Icon name="close" className="h-3 w-3" />
              </button>
            )}
            <span className="ml-auto text-xs text-ink-400">
              {posts?.length ?? 0} {posts?.length === 1 ? "post" : "posts"}
            </span>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          {posts === null ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Icon name="message" className="h-6 w-6" />}
                title={filters.tag ? `Nothing tagged #${filters.tag}` : "No posts yet"}
                description={filters.tag
                  ? "Try another tag, or clear the filter to see everything."
                  : "Be the first — the question you're embarrassed to ask is the one three other people also have."}
                action={filters.tag && (
                  <Button variant="secondary" onClick={() => setFilters({ ...filters, tag: "" })}>
                    Clear filter
                  </Button>
                )}
              />
            </Card>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} onChanged={patch} />)
          )}
        </div>

        {/* ----------------------------------------------------- sidebar */}
        <aside className="lg:col-span-1">
          <div className="space-y-4 lg:sticky lg:top-24">
            <Card>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">
                Popular tags
              </p>
              {tagCounts.length === 0 ? (
                <p className="text-sm text-ink-400">No tags yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tagCounts.map(([tag, count]) => (
                    <button key={tag}
                      onClick={() => setFilters({ ...filters, tag: filters.tag === tag ? "" : tag })}
                      className={cx(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        filters.tag === tag
                          ? "bg-brand-600 text-white"
                          : "bg-white/60 text-ink-500 ring-1 ring-white/70 hover:bg-white/90 hover:text-brand-700"
                      )}>
                      #{tag} <span className="opacity-60">{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">
                Posting well
              </p>
              <ul className="space-y-2 text-xs leading-relaxed text-ink-500">
                <li className="flex gap-2">
                  <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.4} />
                  Include numbers — rent, fees, timelines.
                </li>
                <li className="flex gap-2">
                  <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.4} />
                  Tag the city so others can filter to it.
                </li>
                <li className="flex gap-2">
                  <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.4} />
                  Rate posts you can verify — ratings feed the insights dashboard.
                </li>
              </ul>
            </Card>
          </div>
        </aside>
      </div>
    </Page>
  );
}
