// SERVICE: rule-based PR eligibility estimator (Module 3).
// Simplified versions of two REAL points systems, per the spec:
//   - Canada Express Entry CRS (core human capital, single applicant)
//   - Australia Skilled Independent visa (subclass 189) points test
// Every factor returns its points so the UI can show an explainable breakdown.

// --- IELTS overall → Canadian Language Benchmark (approximate mapping) ---
const ieltsToCLB = (ielts) => {
  if (ielts >= 8) return 10;
  if (ielts >= 7) return 9;
  if (ielts >= 6.5) return 8;
  if (ielts >= 6) return 7;
  if (ielts >= 5.5) return 6;
  return 5;
};

// ---------------- Canada CRS (simplified core factors) ----------------
export function canadaCRS({ age, education, yearsExperience, ielts }) {
  const breakdown = [];

  // Age (single applicant table, simplified)
  const agePoints =
    age < 18 ? 0 :
    age === 18 ? 99 :
    age === 19 ? 105 :
    age <= 29 ? 110 :
    { 30: 105, 31: 99, 32: 94, 33: 88, 34: 83, 35: 77, 36: 72, 37: 66,
      38: 61, 39: 55, 40: 50, 41: 39, 42: 28, 43: 17, 44: 6 }[age] ?? 0;
  breakdown.push({ factor: "Age", points: agePoints, max: 110 });

  // Education
  const eduPoints = { highschool: 30, bachelors: 120, masters: 135, phd: 150 }[education] ?? 30;
  breakdown.push({ factor: "Education", points: eduPoints, max: 150 });

  // First official language (approximated from overall IELTS)
  const clb = ieltsToCLB(ielts);
  const langPoints = { 10: 136, 9: 124, 8: 92, 7: 68, 6: 36, 5: 24 }[clb] ?? 0;
  breakdown.push({ factor: `Language (≈CLB ${clb})`, points: langPoints, max: 136 });

  // Skill transferability: education × language
  const eduTransfer =
    education === "highschool" ? 0 : clb >= 9 ? 50 : clb >= 7 ? 25 : 0;
  breakdown.push({ factor: "Education × language transferability", points: eduTransfer, max: 50 });

  // Skill transferability: foreign work experience × language
  const expTransfer =
    yearsExperience >= 3 ? (clb >= 9 ? 50 : clb >= 7 ? 25 : 0)
    : yearsExperience >= 1 ? (clb >= 9 ? 25 : clb >= 7 ? 13 : 0)
    : 0;
  breakdown.push({ factor: "Work experience × language transferability", points: expTransfer, max: 50 });

  const total = breakdown.reduce((s, b) => s + b.points, 0);

  // Recent all-program draws hover around ~490-530.
  let verdict, level;
  if (total >= 490) { level = "strong"; verdict = "Competitive for recent Express Entry draws."; }
  else if (total >= 430) { level = "close"; verdict = "Below typical all-program cutoffs, but Provincial Nominee Programs (+600) or French points could close the gap."; }
  else { level = "below"; verdict = "Well below current cutoffs — a Canadian degree or higher IELTS would add the most points."; }

  return { system: "Canada Express Entry (CRS, simplified core)", total, maxTotal: 496,
    passHint: "recent draws ≈ 490-530", breakdown, level, verdict };
}

// ---------------- Australia points test (subclass 189) ----------------
export function australiaPoints({ age, education, yearsExperience, ielts }) {
  const breakdown = [];

  const agePoints =
    age >= 18 && age <= 24 ? 25 :
    age <= 32 ? 30 :
    age <= 39 ? 25 :
    age <= 44 ? 15 : 0;
  breakdown.push({ factor: "Age", points: agePoints, max: 30 });

  // English: competent (6) mandatory but 0 pts; proficient (7) 10; superior (8) 20
  const engPoints = ielts >= 8 ? 20 : ielts >= 7 ? 10 : 0;
  breakdown.push({ factor: "English language", points: engPoints, max: 20 });

  const expPoints =
    yearsExperience >= 8 ? 15 :
    yearsExperience >= 5 ? 10 :
    yearsExperience >= 3 ? 5 : 0;
  breakdown.push({ factor: "Overseas skilled experience", points: expPoints, max: 15 });

  const eduPoints = { phd: 20, masters: 15, bachelors: 15, highschool: 0 }[education] ?? 0;
  breakdown.push({ factor: "Education", points: eduPoints, max: 20 });

  const total = breakdown.reduce((s, b) => s + b.points, 0);

  let verdict, level;
  if (ielts < 6) { level = "below"; verdict = "IELTS 6.0 in every band is mandatory before any points count."; }
  else if (total >= 65) { level = "strong"; verdict = "Meets the 65-point pass mark — eligible to lodge an Expression of Interest."; }
  else if (total >= 50) { level = "close"; verdict = "Below the 65 pass mark, but a regional visa (subclass 491, +15 points) or partner/state points could qualify you."; }
  else { level = "below"; verdict = "Well below the pass mark today — age and English are usually the biggest levers."; }

  return { system: "Australia Skilled Independent (189) points test", total, maxTotal: 85,
    passHint: "pass mark 65", breakdown, level, verdict };
}
