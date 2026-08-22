// CONTROLLER: forum insights dashboard (Module 3).
// Spec: "aggregates by city/tag: top concerns, average ratings,
// most-discussed topics, and seasonal trends from post timestamps.
// Computed with DB aggregation" — these are real MongoDB aggregation
// pipelines, not JavaScript loops.
import Post from "../models/Post.js";

// GET /api/forum/insights
export const getInsights = async (req, res, next) => {
  try {
    const [topTags, ratingByTag, byCity, byMonth, totals, ratingSpread, contributors] =
      await Promise.all([
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

      // Where the discussion is happening — plus that city's best post.
      // $sort before $group, then $first, is how you pick a representative
      // document per bucket in a single pipeline.
      Post.aggregate([
        { $match: { city: { $nin: [null, ""] } } },
        {
          $addFields: {
            score: {
              $subtract: [{ $size: "$upvotes" }, { $size: { $ifNull: ["$downvotes", []] } }],
            },
          },
        },
        { $sort: { score: -1 } },
        {
          $group: {
            _id: "$city",
            posts: { $sum: 1 },
            topTitle: { $first: "$title" },
            topScore: { $first: "$score" },
          },
        },
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

      // How the community actually scores things — one bucket per star value.
      // A distribution says something an average hides: whether opinion is
      // clustered or split.
      Post.aggregate([
        { $unwind: "$ratings" },
        { $group: { _id: "$ratings.stars", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Who is carrying the community. $lookup joins the author's name in the
      // same round trip rather than populating afterwards.
      Post.aggregate([
        {
          $group: {
            _id: "$author",
            posts: { $sum: 1 },
            upvotes: { $sum: { $size: "$upvotes" } },
            comments: { $sum: { $size: "$comments" } },
          },
        },
        { $sort: { upvotes: -1, posts: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "author" } },
        { $unwind: "$author" },
        { $project: { _id: 0, name: "$author.name", posts: 1, upvotes: 1, comments: 1 } },
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
      byCity: byCity.map((c) => ({
        city: c._id,
        posts: c.posts,
        topTitle: c.topTitle,
        topScore: c.topScore,
      })),
      // Always all five buckets, so an unused star still shows as a zero
      // rather than silently vanishing from the chart.
      ratingSpread: [1, 2, 3, 4, 5].map((stars) => ({
        stars,
        count: ratingSpread.find((r) => r._id === stars)?.count ?? 0,
      })),
      contributors,
      byMonth: byMonth.map((m) => ({
        label: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
        posts: m.posts,
      })),
    });
  } catch (err) {
    next(err);
  }
};
