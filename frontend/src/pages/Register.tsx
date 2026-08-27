import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../store/useAuth";
import { Button, Input, Card } from "../components/ui";

export function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.register(name.trim(), email.trim(), password);
      setAuth(res.access_token, res.user);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 72% 10%, rgba(131,56,236,0.09), transparent 38%)" }} />
      <Card className="w-full max-w-[420px] relative">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="grid h-8 w-8 place-items-center rounded-md text-white font-bold text-[13px]" style={{ background: "var(--violet-500)" }} aria-hidden>◆</div>
          <span className="text-title font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>PadhAI</span>
        </div>
        <h1 className="text-heading-sm" style={{ fontFamily: "var(--font-display)" }}>Create account</h1>
        <p className="text-body-sm text-muted mt-1">Start your personalized learning path — Tera Raasta, AI ke Saath.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="reg-name">Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input id="reg-name" placeholder="Aarav Sharma" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" autoComplete="name" required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="reg-email">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" autoComplete="email" required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="reg-password">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input id="reg-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" autoComplete="new-password" required />
            </div>
            <p className="helper-text">Minimum 6 characters.</p>
          </div>

          {error && <div className="alert alert-error text-sm py-2 px-3">{error}</div>}

          <Button type="submit" loading={loading} className="w-full">
            <UserPlus size={16} /> Create account
          </Button>
        </form>

        <p className="text-body-sm text-muted text-center mt-6">
          Already have an account? <Link to="/login" className="link font-semibold">Sign in</Link>
        </p>
        <p className="text-caption text-muted text-center mt-3">
          <Link to="/" className="hover:text-secondary">← Back to home</Link>
        </p>
      </Card>
    </div>
  );
}
