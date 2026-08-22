// MODEL: one forum post (Module 3 — Community Forum & Insights).
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 150 },
    body: { type: String, required: [true, "Post body is required"], trim: true, maxlength: 5000 },
    tags: {
      type: [String], // e.g. ["visa", "housing"] — lowercase, used in analytics
      validate: [(t) => t.length <= 5, "Maximum 5 tags"],
    },
    city: { type: String, trim: true }, // optional; insights aggregate by city

    // Votes: store voter ids so one user = one vote (toggle). Up and down are
    // separate arrays and a user may appear in AT MOST ONE of them — the
    // controller moves them across rather than letting both hold the same id.
    // Score = upvotes - downvotes.
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Set the first time an author edits, so the UI can be honest that the
    // text changed after people voted on it.
    editedAt: Date,

    // Star ratings (1-5): one per user, updatable. "How helpful is this topic?"
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        stars: { type: Number, min: 1, max: 5, required: true },
      },
    ],

    // Replies embedded — a forum thread is always read with its post.
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        authorName: String, // denormalized so we don't populate for every list
        text: { type: String, required: true, trim: true, maxlength: 2000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

postSchema.index({ tags: 1 });
postSchema.index({ city: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);
export default Post;
