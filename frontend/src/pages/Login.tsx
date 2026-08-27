import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../store/useAuth";
import { Button, Input, Card } from "../components/ui";

export function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.login(email.trim(), password);
      setAuth(res.access_token, res.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed.";
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
        <h1 className="text-heading-sm" style={{ fontFamily: "var(--font-display)" }}>Welcome back</h1>
        <p className="text-body-sm text-muted mt-1">Sign in to continue your learning path.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="login-email">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" autoComplete="email" required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="login-password">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" autoComplete="current-password" required />
            </div>
          </div>

          {error && <div className="alert alert-error text-sm py-2 px-3">{error}</div>}

          <Button type="submit" loading={loading} className="w-full">
            <LogIn size={16} /> Sign in
          </Button>
        </form>

        <p className="text-body-sm text-muted text-center mt-6">
          Don&apos;t have an account? <Link to="/register" className="link font-semibold">Create one</Link>
        </p>
        <p className="text-caption text-muted text-center mt-3">
          <Link to="/" className="hover:text-secondary">← Back to home</Link>
        </p>
      </Card>
    </div>
  );
}
