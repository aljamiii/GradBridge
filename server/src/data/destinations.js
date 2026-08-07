// Destination profiles for the Life Compatibility Score (Module 3).
// Each attribute is 0-100. These are editorial ratings for Bangladeshi
// students, matching the knowledge base cities plus common alternatives.
//   affordability: how far a taka stretches (tuition + living)
//   warmth:        how warm the climate feels year-round
//   community:     Bangladeshi/Muslim community + halal infrastructure
//   safety:        day-to-day student safety
const destinations = [
  { city: "Toronto", country: "Canada", affordability: 35, warmth: 30, community: 95, safety: 85 },
  { city: "Vancouver", country: "Canada", affordability: 30, warmth: 45, community: 75, safety: 85 },
  { city: "London", country: "United Kingdom", affordability: 25, warmth: 45, community: 100, safety: 70 },
  { city: "Manchester", country: "United Kingdom", affordability: 45, warmth: 40, community: 85, safety: 72 },
  { city: "Berlin", country: "Germany", affordability: 70, warmth: 40, community: 65, safety: 80 },
  { city: "Munich", country: "Germany", affordability: 55, warmth: 42, community: 55, safety: 90 },
  { city: "Melbourne", country: "Australia", affordability: 40, warmth: 60, community: 80, safety: 88 },
  { city: "Sydney", country: "Australia", affordability: 30, warmth: 68, community: 78, safety: 88 },
  { city: "Kuala Lumpur", country: "Malaysia", affordability: 95, warmth: 100, community: 100, safety: 75 },
  { city: "Stockholm", country: "Sweden", affordability: 50, warmth: 25, community: 45, safety: 92 },
];

export default destinations;
