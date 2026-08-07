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

    // Upvotes: store voter ids so one user = one vote (toggle).
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

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
