// CONTROLLER: community forum (Module 3) — posts, upvotes, ratings, comments.
import Post from "../models/Post.js";

// Normalize "Visa, IELTS " → ["visa", "ielts"] (lowercase, deduped, max 5).
const cleanTags = (tags) =>
  [...new Set(
    (Array.isArray(tags) ? tags : String(tags ?? "").split(","))
      .map((t) => String(t).trim().toLowerCase())
      .filter((t) => t.length >= 2 && t.length <= 25)
  )].slice(0, 5);

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
  upvoteCount: post.upvotes.length,
  upvotedByMe: post.upvotes.some((u) => String(u) === String(userId)),
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

// GET /api/forum?tag=&city=&sort=new|top
export const listPosts = async (req, res, next) => {
  try {
    const { tag, city, sort = "new" } = req.query;

    const filter = {};
    if (tag) filter.tags = String(tag).toLowerCase();
    if (city) filter.city = new RegExp(`^${String(city).trim()}$`, "i");

    let posts = await Post.find(filter).populate("author", "name").limit(100);

    posts =
      sort === "top"
        ? posts.sort((a, b) => b.upvotes.length - a.upvotes.length)
        : posts.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      count: posts.length,
      posts: posts.slice(0, 30).map((p) => shape(p, req.user._id)),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/forum/:id/upvote — toggle my vote
export const toggleUpvote = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name");
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    const i = post.upvotes.findIndex((u) => String(u) === String(req.user._id));
    if (i >= 0) post.upvotes.splice(i, 1);
    else post.upvotes.push(req.user._id);
    await post.save();

    res.json({ success: true, post: shape(post, req.user._id) });
  } catch (err) {
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

    res.json({ success: true, post: shape(post, req.user._id) });
  } catch (err) {
    next(err);
  }
};
