import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // One handler for every input: uses the input's name attribute.
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Start planning your journey abroad.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Role picker */}
          <div className="grid grid-cols-2 gap-2">
            {["student", "mentor"].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                  form.role === r
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {r === "student" ? "🎓 Student" : "🧭 Mentor"}
              </button>
            ))}
          </div>

          <input name="name" placeholder="Full name" value={form.name}
            onChange={handleChange} required className={inputClass} />
          <input name="email" type="email" placeholder="Email" value={form.email}
            onChange={handleChange} required className={inputClass} />
          <input name="phone" placeholder="Phone (optional)" value={form.phone}
            onChange={handleChange} className={inputClass} />
          <input name="password" type="password" placeholder="Password (min 6 characters)"
            value={form.password} onChange={handleChange} required minLength={6}
            className={inputClass} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
