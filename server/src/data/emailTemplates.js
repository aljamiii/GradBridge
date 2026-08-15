// Templates for the Supervisor Email Composer (Module 3).
// Deliberately NO AI: the spec asks for a rule-based mail-merge, and a
// template the student can read and edit beats a generated paragraph they
// can't defend in an interview. Placeholders are {{key}} and are filled by
// tools.controller.composeEmail — unfilled ones stay visible so the student
// can see exactly what still needs their input.

const templates = [
  {
    id: "phd-inquiry",
    name: "PhD supervision inquiry",
    description: "First contact with a professor about a funded PhD position.",
    subject: "Prospective PhD applicant — {{researchInterest}} ({{intake}})",
    body: `Dear Professor {{professorName}},

My name is {{studentName}}, and I completed my {{degree}} with a CGPA of {{cgpa}} on a 4.00 scale. I am writing to ask whether you will be accepting PhD students at {{university}} for the {{intake}} intake.

My research interest is {{researchInterest}}. I read your paper "{{paperTitle}}" and found the approach directly relevant to what I want to pursue — in particular, I would like to explore how it could be extended to problems I worked on during my undergraduate thesis.

{{englishLine}}

I have attached my CV and transcript. I would be grateful for the chance to discuss whether my background fits your group, and I am happy to send a short research proposal if that would help.

Thank you for your time and consideration.

Sincerely,
{{studentName}}
{{email}}`,
  },
  {
    id: "masters-inquiry",
    name: "Master's program inquiry",
    description: "Ask a department about admission requirements and funding.",
    subject: "Enquiry — {{degreeLevel}} in {{program}}, {{intake}} intake",
    body: `Dear Admissions Committee,

My name is {{studentName}} and I am applying to the {{degreeLevel}} programme in {{program}} at {{university}} for the {{intake}} intake.

I hold a {{degree}} with a CGPA of {{cgpa}} on a 4.00 scale, and my area of interest is {{researchInterest}}. {{englishLine}}

I would be grateful if you could clarify two points:

1. Whether my degree meets the entry requirements for this programme.
2. What funding, assistantships or scholarships international applicants from Bangladesh are eligible for, and their deadlines.

Thank you very much for your help.

Kind regards,
{{studentName}}
{{email}}`,
  },
  {
    id: "funding-followup",
    name: "Funding follow-up",
    description: "Polite nudge after an application, asking about assistantships.",
    subject: "Funding enquiry — {{studentName}}, {{program}} application",
    body: `Dear Professor {{professorName}},

Thank you for taking the time to read my application to the {{program}} programme at {{university}}.

I am writing to ask whether there are research or teaching assistantship opportunities in your group for the {{intake}} intake. As an international applicant from Bangladesh, funding is the deciding factor in whether I can accept an offer, so I would rather ask directly than assume.

My background is in {{researchInterest}}, and I would be glad to contribute to ongoing projects in your lab from the first semester.

I appreciate any guidance you can offer.

Sincerely,
{{studentName}}
{{email}}`,
  },
];

export default templates;
