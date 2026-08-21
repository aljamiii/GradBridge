import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import { Alert, Button, Field, Input, cx } from "../components/ui";

const ROLES = [
  { value: "student", icon: "🎓", label: "Student", desc: "Planning to study abroad" },
  { value: "mentor", icon: "🧭", label: "Mentor", desc: "Guiding students (verified)" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", role: "student",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // One handler for every input: uses the input's name attribute.
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser's full-page form reload
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/dashboard"); // success → straight to dashboard
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="One profile — every tool personalises itself around it."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role picker */}
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <button type="button" key={r.value}
              onClick={() => setForm({ ...form, role: r.value })}
              aria-pressed={form.role === r.value}
              className={cx(
                "rounded-xl border p-3 text-left transition-all duration-200",
                form.role === r.value
                  ? "border-brand-600 bg-brand-50 ring-4 ring-brand-500/10"
                  : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              )}>
              <span className="text-lg">{r.icon}</span>
              <span className={cx("mt-1 block text-sm font-semibold",
                form.role === r.value ? "text-brand-700" : "text-ink-700")}>
                {r.label}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-ink-400">{r.desc}</span>
            </button>
          ))}
        </div>

        <Field label="Full name">
          <Input name="name" autoComplete="name" placeholder="K. M. Muhaiminul Islam"
            value={form.name} onChange={handleChange} required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" placeholder="you@example.com"
            value={form.email} onChange={handleChange} required />
        </Field>
        <Field label="Phone" hint="Optional — mentors can reach you faster.">
          <Input name="phone" autoComplete="tel" placeholder="+880 1XXX-XXXXXX"
            value={form.phone} onChange={handleChange} />
        </Field>
        <Field label="Password" hint="At least 6 characters.">
          <Input name="password" type="password" autoComplete="new-password"
            placeholder="••••••••" value={form.password} onChange={handleChange}
            required minLength={6} />
        </Field>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
