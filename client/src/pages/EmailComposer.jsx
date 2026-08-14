import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Page, PageHeader, Select, cx,
} from "../components/ui";

export default function EmailComposer() {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    templateId: "",
    professorName: "",
    university: "",
    paperTitle: "",
    program: "",
    degreeLevel: "Masters",
    intake: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    api("/api/tools/email-templates")
      .then((d) => {
        setTemplates(d.templates);
        setForm((f) => ({ ...f, templateId: d.templates[0]?.id ?? "" }));
      })
      .catch((err) => setError(err.message));
  }, []);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const compose = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setResult(await api("/api/tools/compose-email", { method: "POST", body: form }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (what, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Couldn't copy — select the text and copy manually.");
    }
  };

  const selected = templates.find((t) => t.id === form.templateId);
  // The PhD template is the only one that uses a specific paper.
  const needsPaper = form.templateId === "phd-inquiry";
  const needsProfessor = form.templateId !== "masters-inquiry";

  return (
    <Page width="6xl">
      <PageHeader
        eyebrow="Module 3 · Rule-based"
        title="Supervisor Email Composer"
        description="Professors ignore generic emails. Pick a template, fill in the specifics, and your saved profile fills the rest — no AI, so every sentence is yours to edit and defend."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* ------------------------------------------------------- form */}
        <Card as="form" onSubmit={compose} className="lg:col-span-2">
          <p className="mb-2 text-sm font-medium text-ink-700">Template</p>
          <div className="space-y-2">
            {templates.map((t) => (
              <button type="button" key={t.id}
                onClick={() => setForm({ ...form, templateId: t.id })}
                aria-pressed={form.templateId === t.id}
                className={cx(
                  "w-full rounded-xl border p-3 text-left transition-all duration-200",
                  form.templateId === t.id
                    ? "border-brand-500 bg-brand-500/10 ring-4 ring-brand-500/10"
                    : "border-white/70 bg-white/50 hover:bg-white/80"
                )}>
                <span className={cx("block text-sm font-semibold",
                  form.templateId === t.id ? "text-brand-700" : "text-ink-700")}>
                  {t.name}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-ink-400">{t.description}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {needsProfessor && (
              <Field label="Professor's surname" hint="As they'd be addressed — “Rahman”, not “Dr. A. Rahman”">
                <Input name="professorName" value={form.professorName} onChange={set}
                  placeholder="Rahman" />
              </Field>
            )}
            <Field label="University">
              <Input name="university" value={form.university} onChange={set}
                placeholder="University of Toronto" />
            </Field>
            {needsPaper && (
              <Field label="Their paper you actually read"
                hint="The single strongest signal that this isn't a mass email.">
                <Input name="paperTitle" value={form.paperTitle} onChange={set}
                  placeholder="Attention Is All You Need" />
              </Field>
            )}
            <Field label="Programme">
              <Input name="program" value={form.program} onChange={set}
                placeholder="Computer Science" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Degree level">
                <Select name="degreeLevel" value={form.degreeLevel} onChange={set}>
                  <option>Masters</option>
                  <option>PhD</option>
                </Select>
              </Field>
              <Field label="Intake">
                <Input name="intake" value={form.intake} onChange={set} placeholder="Fall 2026" />
              </Field>
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" loading={loading} disabled={!form.templateId}>
            {loading ? "Composing…" : "Compose email"}
          </Button>
        </Card>

        {/* ----------------------------------------------------- preview */}
        <div className="lg:col-span-3">
          {error && <Alert tone="error" className="mb-5">{error}</Alert>}

          {!result ? (
            <Card>
              <EmptyState
                icon={<Icon name="message" className="h-6 w-6" />}
                title="Your draft appears here"
                description="Fill in the form and the template merges with your profile — name, degree, CGPA, research interest and English score are pulled in automatically."
              />
            </Card>
          ) : (
            <Card className="animate-rise">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Badge tone="brand">{result.template.name}</Badge>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="secondary"
                    onClick={() => copy("body", `${result.subject}\n\n${result.body}`)}>
                    <Icon name={copied === "body" ? "check" : "external"} className="h-3.5 w-3.5" />
                    {copied === "body" ? "Copied" : "Copy all"}
                  </Button>
                  <Button size="sm" href={result.mailto}>
                    <Icon name="message" className="h-3.5 w-3.5" />
                    Open in mail app
                  </Button>
                </div>
              </div>

              {result.missing?.length > 0 && (
                <Alert tone="warning" className="mb-4">
                  <span className="flex items-start gap-2">
                    <Icon name="target" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Still to fill in: <b>{result.missing.join(", ")}</b>. They&apos;re left
                      as <code className="rounded bg-amber-100 px-1">{"{{braces}}"}</code> in
                      the draft so you can spot them.
                    </span>
                  </span>
                </Alert>
              )}

              <div className="glass-inset rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">Subject</p>
                <p className="mt-1 font-semibold text-ink-900">{result.subject}</p>
              </div>

              <div className="glass-inset mt-3 rounded-xl p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">Body</p>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-700">
                  {result.body}
                </pre>
              </div>

              <p className="mt-4 flex items-start gap-2 text-xs text-ink-400">
                <Icon name="sparkles" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Read it once before sending. A professor can tell the difference
                between a template you edited and one you didn&apos;t.
              </p>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
