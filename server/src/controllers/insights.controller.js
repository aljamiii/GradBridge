// CONTROLLER: forum insights dashboard (Module 3).
// Spec: "aggregates by city/tag: top concerns, average ratings,
// most-discussed topics, and seasonal trends from post timestamps.
// Computed with DB aggregation" — these are real MongoDB aggregation
// pipelines, not JavaScript loops.
import Post from "../models/Post.js";

// GET /api/forum/insights
export const getInsights = async (req, res, next) => {
  try {
    const [topTags, ratingByTag, byCity, byMonth, totals] = await Promise.all([
      // Most-discussed topics: unwind tags → count + total upvotes per tag.
      Post.aggregate([
        { $unwind: "$tags" },
        {
          $group: {
            _id: "$tags",
            posts: { $sum: 1 },
            upvotes: { $sum: { $size: "$upvotes" } },
            comments: { $sum: { $size: "$comments" } },
          },
        },
        { $sort: { posts: -1 } },
        { $limit: 8 },
      ]),

      // Average star rating per tag (only rated posts count).
      Post.aggregate([
        { $match: { "ratings.0": { $exists: true } } },
        { $unwind: "$tags" },
        { $unwind: "$ratings" },
        {
          $group: {
            _id: "$tags",
            avgRating: { $avg: "$ratings.stars" },
            ratings: { $sum: 1 },
          },
        },
        { $match: { ratings: { $gte: 2 } } }, // need a few votes to mean anything
        { $sort: { avgRating: -1 } },
        { $limit: 8 },
      ]),

      // Where the discussion is happening.
      Post.aggregate([
        { $match: { city: { $nin: [null, ""] } } },
        { $group: { _id: "$city", posts: { $sum: 1 } } },
        { $sort: { posts: -1 } },
        { $limit: 8 },
      ]),

      // Seasonal trend: posts per calendar month across the last 12 months.
      Post.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
            posts: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),

      // Headline numbers.
      Post.aggregate([
        {
          $group: {
            _id: null,
            posts: { $sum: 1 },
            upvotes: { $sum: { $size: "$upvotes" } },
            comments: { $sum: { $size: "$comments" } },
          },
        },
      ]),
    ]);

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    res.json({
      success: true,
      totals: totals[0] ?? { posts: 0, upvotes: 0, comments: 0 },
      topTags: topTags.map((t) => ({ tag: t._id, posts: t.posts, upvotes: t.upvotes, comments: t.comments })),
      ratingByTag: ratingByTag.map((t) => ({
        tag: t._id,
        avgRating: Math.round(t.avgRating * 10) / 10,
        ratings: t.ratings,
      })),
      byCity: byCity.map((c) => ({ city: c._id, posts: c.posts })),
      byMonth: byMonth.map((m) => ({
        label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
        posts: m.posts,
      })),
    });
  } catch (err) {
    next(err);
  }
};
