// One-off script: seed demo forum posts so the insights dashboard has shape.
//   cd server && node src/scripts/seedForum.js
// Wipes existing posts and recreates them (demo data only).
import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import Post from "../models/Post.js";
import User from "../models/User.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// monthsAgo: spreads posts across the year for the seasonal trend chart.
const POSTS = [
  { title: "IELTS 7 in 6 weeks — my full routine", body: "Sharing the exact daily routine I followed to go from 6 to 7. Cambridge books 14-18, one full mock every Friday, and shadowing YouTube news for speaking. Ask me anything.", tags: ["ielts", "preparation"], city: "Dhaka", monthsAgo: 11, stars: [5, 5, 4], votes: 6, comments: ["This helped me so much bhai", "Which mock tests did you use?"] },
  { title: "Canada visa file checklist that got me approval in 3 weeks", body: "My complete SDS file: proof of funds via GIC, LOA, medical upfront, SOP-letter of explanation. Happy to review your list in comments.", tags: ["visa", "canada"], city: "Toronto", monthsAgo: 10, stars: [5, 4, 5, 5], votes: 9, comments: ["Did you show sponsor income?", "How much GIC?"] },
  { title: "Housing scam warning: never pay deposit before video tour", body: "Almost lost 800 EUR to a fake WG listing in Berlin. Red flags: too-good rent, landlord 'abroad', pressure to pay via transfer. Always demand a live video tour.", tags: ["housing", "scam", "germany"], city: "Berlin", monthsAgo: 9, stars: [5, 5], votes: 12, comments: ["Same thing happened to my friend", "wg-gesucht verified listings only!"] },
  { title: "How I found halal food on campus in Stockholm", body: "KTH campus tips: the Sizzler kebab in the Ostermalm hall is certified, and Rinkeby market has everything deshi. Meal-prepping Sundays saved me 1500 SEK/month.", tags: ["food", "halal"], city: "Stockholm", monthsAgo: 8, stars: [4, 4, 5], votes: 4, comments: ["Rinkeby is a lifesaver"] },
  { title: "Funding reality check: RA/TA positions in Canada", body: "Most CS Master's funding comes from supervisor RA-ships, not scholarships. Email professors BEFORE applying — my 40 emails got 6 replies and 1 offer that covers tuition.", tags: ["funding", "canada", "supervisor"], city: "Toronto", monthsAgo: 7, stars: [5, 5, 5, 4], votes: 15, comments: ["What did your email say?", "6/40 is actually a great rate", "Sharing my template in a post soon"] },
  { title: "Part-time work in Melbourne: what 48h/fortnight really looks like", body: "Woolworths night shifts pay AUD 29/hr with penalty rates. Between classes it's doable but exhausting. Budget as if you'll work 15h/week max during exam months.", tags: ["jobs", "australia"], city: "Melbourne", monthsAgo: 6, stars: [4, 4], votes: 7, comments: ["Do they hire internationals easily?"] },
  { title: "Winter depression is real — how I coped in month 3", body: "Nobody warns you about December darkness. Vitamin D, a daylight lamp from Amazon, and forcing myself to the gym twice a week changed everything. Talk to someone if you're struggling.", tags: ["mental-health", "weather"], city: "Stockholm", monthsAgo: 5, stars: [5, 5, 5], votes: 18, comments: ["Thank you for posting this", "The MSA weekly dinners helped me a lot", "Needed this today"] },
  { title: "Bank account + SIN in first week: Toronto newcomer speedrun", body: "Day 1: SIN at Service Canada (walk-in, 30 min). Day 2: RBC student account with newcomer offer. Day 3: presto card + phone plan at Freedom. Done before orientation.", tags: ["banking", "canada", "newcomer"], city: "Toronto", monthsAgo: 4, stars: [4, 5], votes: 8, comments: ["Freedom coverage is meh downtown fyi"] },
  { title: "German blocked account: Expatrio vs Fintiba comparison", body: "Both work. Expatrio bundle includes health insurance which simplified my visa file. Transfer via Wise to avoid the 2% bank markup on 11,900 EUR.", tags: ["visa", "germany", "banking"], city: "Berlin", monthsAgo: 3, stars: [4, 4, 4], votes: 5, comments: ["Wise tip saved me real money, thanks"] },
  { title: "KL budget breakdown: my actual monthly spending at UM", body: "RM 950 condo share, RM 600 food (mamak life), RM 150 Grab/LRT, RM 100 phone+misc. Under RM 2000/month living well. AMA about Malaysia costs.", tags: ["budget", "malaysia"], city: "Kuala Lumpur", monthsAgo: 2, stars: [5, 4], votes: 6, comments: ["Is on-campus housing cheaper?"] },
  { title: "SOP mistakes I made (and my admit after fixing them)", body: "V1 was my CV in paragraphs — rejected twice. V2 told one research story connecting my thesis to the professor's lab. Three sentences about THEIR work matter more than three paragraphs about yours.", tags: ["sop", "preparation"], city: "Dhaka", monthsAgo: 1, stars: [5, 5, 4, 5], votes: 14, comments: ["Can you share V2 structure?", "This is gold"] },
  { title: "Ramadan abroad: campus iftar map for London unis", body: "ELM serves free iftar all month. Imperial ISoc runs daily iftars at the union. UCL Friday community dinners are open to everyone. Add your uni in comments!", tags: ["community", "halal", "uk"], city: "London", monthsAgo: 0, stars: [5, 5], votes: 10, comments: ["QMUL has one too, adding", "Jazakallah for this"] },
];

await mongoose.connect(process.env.MONGO_URI);
console.log("🍃 Connected. Seeding forum...");

// Authors/voters: the demo abroad students + the test student.
const users = await User.find({
  email: { $regex: "@demo.gradbridge.dev$|muhaiminul@test.com" },
});
if (users.length < 3) {
  console.error("Run seedAbroadStudents.js first (need demo users).");
  process.exit(1);
}

await Post.deleteMany({});

for (const [i, p] of POSTS.entries()) {
  const author = users[i % users.length];
  const others = users.filter((u) => u._id !== author._id);
  const created = new Date();
  created.setMonth(created.getMonth() - p.monthsAgo);
  created.setDate(3 + ((i * 7) % 24)); // vary the day a bit

  await Post.create({
    author: author._id,
    title: p.title,
    body: p.body,
    tags: p.tags,
    city: p.city,
    upvotes: others.slice(0, Math.min(p.votes, others.length)).map((u) => u._id),
    ratings: p.stars.map((stars, j) => ({ user: others[j % others.length]._id, stars })),
    comments: p.comments.map((text, j) => ({
      author: others[j % others.length]._id,
      authorName: others[j % others.length].name,
      text,
    })),
    createdAt: created,
    updatedAt: created,
  });
  console.log(`  ✔ ${p.title.slice(0, 50)}...`);
}

console.log(`✅ Seeded ${POSTS.length} posts.`);
await mongoose.disconnect();
process.exit(0);
