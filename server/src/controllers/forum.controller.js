// CONTROLLER: community forum (Module 3) — posts, upvotes, ratings, comments.
import Post from "../models/Post.js";
import { notify } from "../services/notify.js";

// Normalize "Visa, IELTS " → ["visa", "ielts"] (lowercase, deduped, max 5).
const cleanTags = (tags) =>
  [...new Set(
    (Array.isArray(tags) ? tags : String(tags ?? "").split(","))
      .map((t) => String(t).trim().toLowerCase())
      .filter((t) => t.length >= 2 && t.length <= 25)
  )].slice(0, 5);

// Escape user input before it is used as a regex — otherwise "." or ".*"
// stops being a literal character and becomes a pattern.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Shape a post for the client (adds computed fields, hides voter ids).
const shape = (post, userId) => ({
  id: post._id,
  title: post.title,
  body: post.body,
  tags: post.tags,
  city: post.city || null,
  authorName: post.author?.name ?? "Unknown",
  // Exposed so the feed can offer "Connect" with a helpful author.
  author: post.author?._id ?? post.author ?? null,
  createdAt: post.createdAt,
  editedAt: post.editedAt ?? null,
  // Lets the client show Edit only on your own posts. The server still
  // re-checks ownership on write — this is for the UI, not for security.
  isMine: String(post.author?._id ?? post.author) === String(userId),
  upvoteCount: post.upvotes.length,
  downvoteCount: (post.downvotes ?? []).length,
  score: post.upvotes.length - (post.downvotes ?? []).length,
  upvotedByMe: post.upvotes.some((u) => String(u) === String(userId)),
  downvotedByMe: (post.downvotes ?? []).some((u) => String(u) === String(userId)),
  avgRating: post.ratings.length
    ? Math.round((post.ratings.reduce((s, r) => s + r.stars, 0) / post.ratings.length) * 10) / 10
    : null,
  ratingCount: post.ratings.length,
  myRating: post.ratings.find((r) => String(r.user) === String(userId))?.stars ?? null,
  comments: post.comments.map((c) => ({
    id: c._id,
    authorName: c.authorName,
    text: c.text,
    createdAt: c.createdAt,
  })),
});

// POST /api/forum   body: { title, body, tags, city }
export const createPost = async (req, res, next) => {
  try {
    const post = await Post.create({
      author: req.user._id,
      title: req.body.title,
      body: req.body.body,
      tags: cleanTags(req.body.tags),
      city: (req.body.city || "").trim(),
    });
    await post.populate("author", "name");
    res.status(201).json({ success: true, post: shape(post, req.user._id) });
  } catch (err) {
    if (err.name === "ValidationError") {
      const firstMessage = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message: firstMessage });
    }
    next(err);
  }
};

const PAGE_SIZE = 30;

// GET /api/forum?tag=&city=&sort=new|top
export const listPosts = async (req, res, next) => {
  try {
    const { tag, city, q, sort = "new" } = req.query;

    const filter = {};
    if (tag) filter.tags = String(tag).toLowerCase();
    // Free-text search across the fields a reader would actually scan.
    // Escaped for the same reason as the city filter below.
    if (q && String(q).trim()) {
      const rx = new RegExp(escapeRegex(String(q).trim()), "i");
      filter.$or = [{ title: rx }, { body: rx }, { tags: rx }, { city: rx }];
    }
    // The city filter is an EXACT, case-insensitive match. Interpolating the
    // raw query string into a regex let metacharacters through: "?city=.*"
    // matched every city, defeating the filter (and a crafted pattern is a
    // backtracking risk). Escape it so it can only ever match literal text.
    if (city) filter.city = new RegExp(`^${escapeRegex(String(city).trim())}$`, "i");

    // Sort in the DATABASE, not in JS. The previous version fetched an
    // unsorted page of 100 and sorted that in memory, so with more than 100
    // posts the "top" post could be missing from the page it ranked. $size
    // gives Mongo the upvote count to sort on; createdAt breaks ties, which
    // matters here because many posts share an upvote total.
    const sortStage =
      sort === "top" ? { score: -1, createdAt: -1 } : { createdAt: -1 };

    const [posts, total] = await Promise.all([
      Post.aggregate([
        { $match: filter },
        // Net score, so a heavily downvoted post cannot ride raw upvotes to
        // the top. $ifNull covers posts created before downvotes existed.
        {
          $addFields: {
            score: {
              $subtract: [{ $size: "$upvotes" }, { $size: { $ifNull: ["$downvotes", []] } }],
            },
          },
        },
        { $sort: sortStage },
        { $limit: PAGE_SIZE },
      ]),
      Post.countDocuments(filter),
    ]);

    // aggregate() returns plain objects, so populate them explicitly.
    await Post.populate(posts, { path: "author", select: "name" });

    res.json({
      success: true,
      count: posts.length,
      total, // everything matching the filter, so the UI can say "30 of 120"
      posts: posts.map((p) => shape(p, req.user._id)),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/forum/:id/vote   body: { dir: 1 | -1 }
// One vote per user. Clicking the direction you already chose clears it;
// clicking the opposite one MOVES your vote rather than counting twice.
export const votePost = async (req, res, next) => {
  try {
    const dir = Number(req.body.dir);
    if (dir !== 1 && dir !== -1) {
      return res.status(400).json({ success: false, message: "Vote must be 1 or -1." });
    }

    const post = await Post.findById(req.params.id).populate("author", "name");
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    const me = String(req.user._id);
    post.downvotes = post.downvotes ?? [];
    const wasUp = post.upvotes.some((u) => String(u) === me);
    const wasDown = post.downvotes.some((u) => String(u) === me);

    // Always withdraw the existing vote first — that alone guarantees a user
    // can never sit in both arrays.
    post.upvotes = post.upvotes.filter((u) => String(u) !== me);
    post.downvotes = post.downvotes.filter((u) => String(u) !== me);

    if (dir === 1 && !wasUp) post.upvotes.push(req.user._id);
    if (dir === -1 && !wasDown) post.downvotes.push(req.user._id);

    await post.save();
    res.json({ success: true, post: shape(post, req.user._id) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/forum/:id   body: { title, body, tags, city }  — author only
export const updatePost = async (req, res, next) => {
  try {
    // Ownership lives in the query, so someone else's id simply finds nothing.
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found, or it isn't yours to edit.",
      });
    }

    const { title, body, tags, city } = req.body;
    if (title !== undefined) post.title = title;
    if (body !== undefined) post.body = body;
    if (tags !== undefined) post.tags = cleanTags(tags);
    if (city !== undefined) post.city = String(city).trim();
    post.editedAt = new Date();

    await post.save(); // runs the schema validators (title/body required, 5 tags)
    await post.populate("author", "name");

    res.json({ success: true, post: shape(post, req.user._id) });
  } catch (err) {
    if (err.name === "ValidationError") {
      const firstMessage = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message: firstMessage });
    }
    next(err);
  }
};

// POST /api/forum/:id/rate   body: { stars }  — one rating per user, updatable
export const ratePost = async (req, res, next) => {
  try {
    const stars = Number(req.body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: "Rating must be 1-5 stars." });
    }

    const post = await Post.findById(req.params.id).populate("author", "name");
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    const existing = post.ratings.find((r) => String(r.user) === String(req.user._id));
    if (existing) existing.stars = stars;
    else post.ratings.push({ user: req.user._id, stars });
    await post.save();

    res.json({ success: true, post: shape(post, req.user._id) });
  } catch (err) {
    next(err);
  }
};

// POST /api/forum/:id/comments   body: { text }
export const addComment = async (req, res, next) => {
  try {
    const text = (req.body.text || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Comment is empty." });

    const post = await Post.findById(req.params.id).populate("author", "name");
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    post.comments.push({ author: req.user._id, authorName: req.user.name, text });
    await post.save();

    // Tell the post's author someone answered (notify() no-ops on self-reply).
    await notify({
      user: post.author?._id ?? post.author,
      type: "forum:reply",
      title: `${req.user.name} replied to your post`,
      body: `“${post.title}” — ${text.slice(0, 80)}${text.length > 80 ? "…" : ""}`,
      link: "/forum",
      actor: req.user,
    });

    res.json({ success: true, post: shape(post, req.user._id) });
  } catch (err) {
    next(err);
  }
};
