import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import {
  Alert, Button, Card, EmptyState, Field, Input, Page, PageHeader, Skeleton, cx,
} from "../components/ui";

const usd = (n) => `$${Number(n).toLocaleString()}`;
const bdt = (n) => `৳${Number(n).toLocaleString()}`;

const LIFESTYLES = [
  { value: "frugal", label: "Frugal", hint: "Shared room, cook at home" },
  { value: "moderate", label: "Moderate", hint: "Balanced spending" },
  { value: "comfortable", label: "Comfortable", hint: "Own place, eat out" },
];

export default function CostPredictor() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    country: user.studentProfile?.preferredCountry ?? "",
    city: "",
    lifestyle: "moderate",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const budget = user.studentProfile?.budgetUSD;

  const predict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await api("/api/ai/cost-predictor", { method: "POST", body: form }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const rows = result && [
    ["Tuition", "1 year", result.breakdownUSD.tuitionPerYear],
    ["Visa & permits", "One-off", result.breakdownUSD.visaFees],
    ["Flight", "One-way", result.breakdownUSD.flightOneWay],
    ["Health insurance", "1 year", result.breakdownUSD.healthInsurancePerYear],
    ["Housing deposit", "Refundable", result.breakdownUSD.housingDeposit],
    ["Living costs", `${usd(result.breakdownUSD.monthlyLiving)}/mo × 12`, result.breakdownUSD.yearlyLiving],
  ];

  // Share of the total, so the biggest line item is obvious at a glance.
  const maxRow = rows && Math.max(...rows.map((r) => r[2]));

  return (
    <Page width="5xl">
      <PageHeader
        eyebrow="Module 1 · AI"
        title="Cost Predictor"
        description="A realistic first-year budget for your destination, estimated by AI and converted at today's exchange rate."
      />

      <Card className="mt-8" as="form" onSubmit={predict}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Target country" hint="Required">
            <Input value={form.country} required
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Canada" />
          </Field>
          <Field label="City" hint="Optional — sharpens the estimate">
            <Input value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Toronto" />
          </Field>
        </div>

        <p className="mb-2 mt-5 text-sm font-medium text-ink-700">Lifestyle</p>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {LIFESTYLES.map((l) => (
            <button type="button" key={l.value}
              onClick={() => setForm({ ...form, lifestyle: l.value })}
              aria-pressed={form.lifestyle === l.value}
              className={cx(
                "rounded-xl border p-3 text-left transition-all duration-200",
                form.lifestyle === l.value
                  ? "border-brand-500 bg-brand-500/10 ring-4 ring-brand-500/10"
                  : "border-white/70 bg-white/50 hover:bg-white/80"
              )}>
              <span className={cx("block text-sm font-semibold",
                form.lifestyle === l.value ? "text-brand-700" : "text-ink-700")}>
                {l.label}
              </span>
              <span className="mt-0.5 block text-xs text-ink-400">{l.hint}</span>
            </button>
          ))}
        </div>

        <Button type="submit" className="mt-6" loading={loading}>
          {loading ? "Calculating…" : "Predict my costs"}
        </Button>
      </Card>

      {error && <Alert tone="error" className="mt-5">{error}</Alert>}

      {loading && (
        <Card className="mt-6 space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </Card>
      )}

      {!result && !loading && !error && (
        <Card className="mt-6">
          <EmptyState
            icon={<Icon name="wallet" className="h-6 w-6" />}
            title="No estimate yet"
            description="Enter a country above. The AI accounts for tuition, visa fees, insurance, housing and monthly living costs for the lifestyle you pick."
          />
        </Card>
      )}

      {result && (
        <div className="animate-rise mt-6 space-y-5">
          {/* Headline total */}
          <Card className="overflow-hidden !p-0">
            <div className="relative bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-7">
              <div aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(20rem_10rem_at_20%_0%,rgb(255_255_255/0.18),transparent_60%)]" />
              <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.09em] text-brand-200">
                    First year in {result.input.city ? `${result.input.city}, ` : ""}{result.input.country}
                  </p>
                  <p className="mt-2 text-4xl font-extrabold tracking-tight text-white">
                    {usd(result.totalUSD)}
                  </p>
                  {result.totalBDT && (
                    <p className="mt-1 text-sm text-brand-100">≈ {bdt(result.totalBDT)}</p>
                  )}
                </div>
                {result.cached && (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-brand-50 backdrop-blur">
                    Served from cache
                  </span>
                )}
              </div>
            </div>

            {/* Breakdown with proportion bars */}
            <div className="divide-y divide-white/60">
              {rows.map(([label, sub, amount]) => (
                <div key={label} className="px-6 py-3.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-medium text-ink-700">
                      {label} <span className="text-xs font-normal text-ink-400">· {sub}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">
                      {usd(amount)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                      style={{ width: `${(amount / maxRow) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Budget verdict */}
          {budget != null && (
            <Alert tone={budget >= result.totalUSD ? "success" : "warning"}>
              <span className="flex items-start gap-2.5">
                <Icon name={budget >= result.totalUSD ? "check" : "trendingDown"}
                  className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
                <span>
                  {budget >= result.totalUSD ? (
                    <>Your budget of <b>{usd(budget)}/yr</b> covers this estimate with{" "}
                      <b>{usd(budget - result.totalUSD)}</b> to spare.</>
                  ) : (
                    <>Your budget of <b>{usd(budget)}/yr</b> is <b>{usd(result.totalUSD - budget)}</b> short.
                      Look at scholarships, or try the frugal lifestyle option.</>
                  )}
                </span>
              </span>
            </Alert>
          )}

          {result.notes?.length > 0 && (
            <Card>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Icon name="sparkles" className="h-4 w-4 text-brand-600" />
                Money tips for {result.input.city || result.input.country}
              </h3>
              <ul className="space-y-2.5">
                {result.notes.map((n) => (
                  <li key={n} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-500">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    {n}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Carry the number the student just produced into the savings
              planner, rather than telling them to write it down. */}
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink-900">Can you cover this?</h3>
              <p className="mt-0.5 text-xs text-ink-400">
                Take {usd(result.totalUSD)} through to the savings planner — no need to retype it.
              </p>
            </div>
            <Button
              to="/financial-risk"
              state={{
                totalCostUSD: result.totalUSD,
                from: result.input.city
                  ? `${result.input.city}, ${result.input.country}`
                  : result.input.country,
              }}
              variant="secondary"
              className="shrink-0"
            >
              Plan my savings <Icon name="arrowRight" className="h-4 w-4" />
            </Button>
          </Card>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-ink-400">
            <span>1 USD ≈ {result.exchange.usdToBdt?.toFixed(1)} BDT</span>
            {result.exchange.usdToLocal && (
              <span>≈ {result.exchange.usdToLocal.toFixed(2)} {result.exchange.currencyLocal}</span>
            )}
            <span>· Rates from {result.exchange.source}</span>
            <span>· AI estimates are indicative — verify tuition on the university site.</span>
          </p>
        </div>
      )}
    </Page>
  );
}
