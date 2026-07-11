// CONTROLLER: Success Path Explorer (Module 3).
// Spec: filter alumni records by background (CGPA, degree, country) →
// admission patterns, funding-type distribution, CGPA ranges, and
// acceptance rates for charts/tables.
import { getAlumniRecords } from "../services/alumniData.js";

const pct = (part, whole) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

// GET /api/success-path?minCgpa=&maxCgpa=&country=&field=
export const getSuccessPath = async (req, res, next) => {
  try {
    const all = await getAlumniRecords();

    const minCgpa = Number(req.query.minCgpa) || 0;
    const maxCgpa = Number(req.query.maxCgpa) || 4;
    const country = (req.query.country || "").trim().toLowerCase();
    const field = (req.query.field || "").trim().toLowerCase();

    const records = all.filter(
      (r) =>
        r.cgpa >= minCgpa &&
        r.cgpa <= maxCgpa &&
        (!country || r.country.toLowerCase() === country) &&
        (!field || r.field.toLowerCase() === field)
    );

    const admitted = records.filter((r) => r.outcome === "admitted");

    // Funding-type distribution among ADMITTED students.
    const funding = { full: 0, partial: 0, self: 0 };
    for (const r of admitted) if (funding[r.funding] != null) funding[r.funding] += 1;

    // Acceptance rate per CGPA range (the "does my CGPA stand a chance?" chart).
    const buckets = [
      { label: "2.8–3.2", min: 2.8, max: 3.2 },
      { label: "3.2–3.5", min: 3.2, max: 3.5 },
      { label: "3.5–3.8", min: 3.5, max: 3.8 },
      { label: "3.8–4.0", min: 3.8, max: 4.01 },
    ].map((b) => {
      const inBucket = records.filter((r) => r.cgpa >= b.min && r.cgpa < b.max);
      const admits = inBucket.filter((r) => r.outcome === "admitted").length;
      return { label: b.label, total: inBucket.length, admitted: admits,
        rate: pct(admits, inBucket.length) };
    });

    // Admission patterns by destination country.
    const byCountry = {};
    for (const r of records) {
      byCountry[r.country] ??= { country: r.country, total: 0, admitted: 0 };
      byCountry[r.country].total += 1;
      if (r.outcome === "admitted") byCountry[r.country].admitted += 1;
    }
    const countries = Object.values(byCountry)
      .map((c) => ({ ...c, rate: pct(c.admitted, c.total) }))
      .sort((a, b) => b.total - a.total);

    res.json({
      success: true,
      // Options for the filter dropdowns (from the FULL dataset).
      options: {
        countries: [...new Set(all.map((r) => r.country))].sort(),
        fields: [...new Set(all.map((r) => r.field))].sort(),
      },
      totals: {
        records: records.length,
        admitted: admitted.length,
        acceptanceRate: pct(admitted.length, records.length),
        fullFundingRate: pct(funding.full, admitted.length),
      },
      funding,
      cgpaBuckets: buckets,
      countries,
      // Anonymized rows for the table view.
      records: records
        .sort((a, b) => b.cgpa - a.cgpa)
        .slice(0, 40)
        .map((r) => ({
          year: r.year, field: r.field, cgpa: r.cgpa, ielts: r.ielts,
          country: r.country, university: r.university, program: r.program,
          funding: r.funding, outcome: r.outcome,
        })),
    });
  } catch (err) {
    next(err);
  }
};
