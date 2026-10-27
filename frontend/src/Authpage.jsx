
import React, { useState } from "react";
import {
  ShieldCheck,
  Mail,
  LockKeyhole,
  UserRound,
  Eye,
  EyeOff,
  ArrowRight,
  Activity,
  ScanSearch,
  Fingerprint,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import "./AuthPage.css";

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (isSignup && name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (password.length < (isSignup ? 12 : 1)) {
      setError(
        isSignup
          ? "Use at least 12 characters for your password."
          : "Enter your password."
      );
      return;
    }

    setBusy(true);

    try {
      const { authApi } = await import("./authApi.js");

      const data = isSignup
        ? await authApi.register(name.trim(), email.trim(), password)
        : await authApi.login(email.trim(), password);

      setPassword("");
      onAuthenticated(data.user);
    } catch (err) {
      setError(
        err.message || "Unable to authenticate. Check your connection."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="auth-brand">
          <span className="auth-brand-icon">
            <ShieldCheck size={23} />
          </span>
          <span>
            PhishGuard <b>AI</b>
          </span>
        </div>

        <div className="auth-visual-content">
          <div className="auth-kicker">
            <span className="auth-pulse" />
            INTELLIGENT THREAT PROTECTION
          </div>

          <h1>
            Your digital world.
            <br />
            <span>Better protected.</span>
          </h1>

          <p className="auth-visual-description">
            Analyze suspicious URLs and email messages from
            one secure workspace built for threat awareness.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span><ScanSearch size={19} /></span>
              <div>
                <b>Intelligent scanning</b>
                <p>Inspect links and email content</p>
              </div>
            </div>

            <div className="auth-feature">
              <span><Activity size={19} /></span>
              <div>
                <b>Threat insights</b>
                <p>Review scan results and risk scores</p>
              </div>
            </div>

            <div className="auth-feature">
              <span><Fingerprint size={19} /></span>
              <div>
                <b>Protected account</b>
                <p>Secure password hashing and sessions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-visual-footer">
          <span>PHISHGUARD AI SECURITY WORKSPACE</span>
          <span>EDUCATIONAL PROTOTYPE</span>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand">
          <span className="auth-brand-icon">
            <ShieldCheck size={22} />
          </span>
          <span>PhishGuard <b>AI</b></span>
        </div>

        <div className="auth-form-container">
          <div className="auth-form-heading">
            <span className="auth-form-icon">
              <ShieldCheck size={23} />
            </span>

            <div className="auth-kicker">SECURE ACCESS</div>

            <h2>
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>

            <p>
              {isSignup
                ? "Set up your security workspace in a few steps."
                : "Sign in to continue to your security workspace."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={!isSignup ? "selected" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Sign in
            </button>

            <button
              type="button"
              className={isSignup ? "selected" : ""}
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="auth-field">
                <label htmlFor="auth-name">Full name</label>
                <div className="auth-input-wrap">
                  <UserRound size={17} />
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your name"
                    value={name}
                    maxLength={80}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email address</label>
              <div className="auth-input-wrap">
                <Mail size={17} />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  maxLength={254}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <div className="auth-input-wrap">
                <LockKeyhole size={17} />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isSignup ? "new-password" : "current-password"
                  }
                  placeholder={
                    isSignup
                      ? "At least 12 characters"
                      : "Enter your password"
                  }
                  value={password}
                  maxLength={128}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isSignup ? 12 : 1}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword
                    ? <EyeOff size={17} />
                    : <Eye size={17} />}
                </button>
              </div>
              {isSignup && (
                <small className="auth-field-hint">
                  Include at least one letter and one number.
                </small>
              )}
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <LoaderCircle size={17} className="auth-spinner" />
                  {isSignup ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>
                  {isSignup ? "Create secure account" : "Sign in securely"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="auth-security-note">
            <LockKeyhole size={15} />
            <span>Your password is hashed on the server.</span>
          </div>
        </div>

        <div className="auth-bottom-note">
          <span><span className="auth-pulse" /> AUTHENTICATION SERVICE</span>
          <span>PhishGuard AI · Local environment</span>
        </div>
      </section>
    </main>
  );
}
