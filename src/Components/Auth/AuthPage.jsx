
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderKanban,
  Layers3,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AuthPage.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { user, loading, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSignup = mode === "signup";
  const destination = location.state?.from;
  const redirectTo =
    destination?.pathname &&
    destination.pathname !== "/login"
      ? `${destination.pathname}${destination.search || ""}${destination.hash || ""}`
      : "/";

  if (loading) {
    return (
      <div className="auth-loading">
        <span className="auth-loading__spinner" />
        <p>Loading TaskFlow...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
  }

  async function handleSubmit(event) {

    if (isSignup && password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    setPasswordError("");
    
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup({ name, email, password });
      } else {
        await login({ email, password });
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setSubmitting(true);

    try {
      await login({
        email: "testacc@task.flow",
        password: "12345678",
      });

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to log into the demo account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link to="/login" className="auth-brand">
          <span className="auth-brand__icon">
            <Layers3 size={21} strokeWidth={2.2} />
          </span>
          <span>taskflow<span className="auth-brand__dot">.</span></span>
        </Link>

        <div className="auth-visual__content">
          <span className="auth-eyebrow">
            <Sparkles size={14} />
            YOUR WORKSPACE, REIMAGINED
          </span>

          <h1>
            Less chaos.
            <br />
            <span>More flow.</span>
          </h1>

          <p className="auth-visual__description">
            Bring your projects, tasks, and team into one
            focused workspace. Know what matters and keep
            moving forward.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="auth-feature__icon">
                <FolderKanban size={17} />
              </span>
              <div>
                <strong>Everything in one place</strong>
                <p>Projects and tasks, organized your way.</p>
              </div>
            </div>

            <div className="auth-feature">
              <span className="auth-feature__icon">
                <CheckCircle2 size={17} />
              </span>
              <div>
                <strong>Progress you can see</strong>
                <p>Track what is moving and what needs attention.</p>
              </div>
            </div>

            <div className="auth-feature">
              <span className="auth-feature__icon">
                <LockKeyhole size={17} />
              </span>
              <div>
                <strong>Your own workspace</strong>
                <p>Sign in securely and pick up where you left off.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="auth-visual__footer">
          A little more clarity, every day.
        </p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-mobile-brand">
          <span className="auth-brand__icon">
            <Layers3 size={21} strokeWidth={2.2} />
          </span>
          <span>taskflow<span className="auth-brand__dot">.</span></span>
        </div>

        <div className="auth-form-container">
          <div className="auth-form-heading">
            <span className="auth-eyebrow">
              {isSignup ? "GET STARTED" : "WELCOME BACK"}
            </span>
            <h2>{isSignup ? "Create your account" : "Good to see you."}</h2>
            <p>
              {isSignup
                ? "Create an account to get your workspace going."
                : "Sign in to pick up where you left off."}
            </p>
          </div>

          <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              className={!isSignup ? "is-active" : ""}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              className={isSignup ? "is-active" : ""}
              onClick={() => switchMode("signup")}
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="auth-field">
                <label htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value.length >= 8) {
                      setPasswordError("");
                    }
                  }}
                  placeholder="Enter your password"
                  required
                  autoComplete={isSignup ? "new-password" : "current-password"}
                />

                {isSignup && passwordError && (
                  <span className="field-error">{passwordError}</span>
                )}
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isSignup && (
                <span className="auth-field-hint">
                  Use at least 8 characters.
                </span>
              )}
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={submitting}
            >
              <span>
                {submitting
                  ? "Please wait..."
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
              </span>
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch-copy">
            {isSignup ? "Already have an account?" : "New to TaskFlow?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? "login" : "signup")}
            >
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>

          <p className="auth-demo-copy">
            Just want to look around?{" "}
            <button
              type="button"
              className="auth-demo-link"
              onClick={handleDemoLogin}
              disabled={submitting || isSignup}
            >
              {submitting ? "Please wait..." : "Log into a demo account"}
            </button>
          </p>
        </div>

        <span className="auth-copyright">
          © {new Date().getFullYear()} TaskFlow
        </span>
      </section>
    </main>
  );
}
