import React, { useState } from "react";

// MUST match App.jsx and frontend/.env exactly.
// Use localhost for both frontend and backend (do not mix localhost/127.0.0.1).
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

async function requestJSON(path, body) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error(`Network request failed: ${path}`, error);
    throw new Error(
      `Cannot connect to FastAPI at ${API_BASE}. Check that the backend is running and CORS allows your frontend origin.`
    );
  }

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text };
  }
if (!response.ok) {
    const detail = data.detail ?? data.message;
    const message =
      typeof detail === "string"
        ? detail
        : detail
          ? JSON.stringify(detail)
          : `HTTP ${response.status}`;

    if (response.status === 401) {
      throw new Error(
        path.endsWith("/login")
          ? "Incorrect email or password. Check your details and try again."
          : message
      );
    }

    if (response.status === 403) {
      throw new Error(
        `Access denied (403). Check FRONTEND origin and CORS settings. ${message}`
      );
    }

    if (response.status === 404) {
      throw new Error(
        "Authentication endpoint not found. Check your FastAPI routes."
      );
    }

    if (response.status === 409) {
      throw new Error(message || "This email is already registered. Please sign in.");
    }

    if (response.status === 422) {
      throw new Error(`Invalid request data: ${message}`);
    }

    if (response.status >= 500) {
      throw new Error(`Backend server error: ${message}`);
    }

    throw new Error(`Request failed (${response.status}): ${message}`);
  }

  return data;
}

export default function Login({ onLogin, sessionError = "" }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";
   function switchMode(nextMode) {
    if (busy) return;
    setMode(nextMode);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (isRegister && !cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (isRegister && password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      if (isRegister) {
        await requestJSON("/api/auth/register", {
          name: cleanName,
          email: cleanEmail,
          password,
        });
      } else {
        await requestJSON("/api/auth/login", {
          email: cleanEmail,
          password,
        });
      }
if (typeof onLogin !== "function") {
        throw new Error("Missing onLogin callback. Check your App.jsx.");
      }

      // App verifies the cookie by requesting GET /api/auth/me.
      await onLogin();
    } catch (err) {
      console.error("PhishGuard authentication error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="pg-auth">
      <style>{`
        .pg-auth, .pg-auth * { box-sizing: border-box; }
        .pg-auth {
          min-height: 100vh; display: grid; place-items: center;
          padding: 28px 16px; color: #f1f5f9;
          background: radial-gradient(ellipse at 50% 0%, rgba(25,199,176,.13), transparent 48%), #080f1d;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .pg-auth button, .pg-auth input { font: inherit; }
        .pg-auth button { cursor: pointer; }
        .pg-auth button:disabled { cursor: not-allowed; opacity: .65; }
        .pg-auth-card {
          width: min(100%, 440px); padding: 34px;
          background: rgba(16,27,45,.97); border: 1px solid #26364b;
          border-radius: 22px; box-shadow: 0 24px 80px rgba(0,0,0,.3);
        }
        .pg-brand-icon {
          display: grid; place-items: center; width: 56px; height: 56px;
          margin: 0 auto 13px; color: #19c7b0;
          background: rgba(25,199,176,.12); border: 1px solid rgba(25,199,176,.25);
          border-radius: 16px;
        }
        .pg-brand-name { text-align: center; color: #f1f5f9; font-size: 25px; font-weight: 800; letter-spacing: -1px; }
        .pg-brand-name span, .pg-eyebrow { color: #19c7b0; }
        .pg-eyebrow { margin-top: 17px; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-align: center; }
        .pg-auth-card h1 { margin: 14px 0 8px; color: #f1f5f9; font-size: 26px; line-height: 1.3; text-align: center; }
        .pg-subtitle { margin: 0 auto 23px; color: #94a3b8; font-size: 13px; line-height: 1.7; text-align: center; }
        .pg-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 23px; padding: 5px; background: #0a1424; border: 1px solid #1d2b3e; border-radius: 12px; }
        .pg-tab { padding: 11px 8px; color: #94a3b8; background: transparent; border: 1px solid transparent; border-radius: 9px; font-size: 13px; font-weight: 650; }
        .pg-tab.active { color: #19c7b0; background: #1a2b3d; border-color: #304456; }
        .pg-field { margin-bottom: 17px; }
        .pg-field label { display: block; margin-bottom: 8px; color: #dbe5f0; font-size: 12px; font-weight: 650; }
        .pg-field input { display: block; width: 100%; min-width: 0; padding: 13px 14px; color: #f1f5f9; background: #0b1525; border: 1px solid #2b3b50; border-radius: 10px; outline: none; font-size: 13px; line-height: 1.5; }
        .pg-field input::placeholder { color: #64748b; }
        .pg-field input:focus { border-color: #19c7b0; box-shadow: 0 0 0 3px rgba(25,199,176,.1); }
        .pg-password-wrap { display: flex; align-items: center; gap: 8px; padding-right: 11px; background: #0b1525; border: 1px solid #2b3b50; border-radius: 10px; }
        .pg-password-wrap:focus-within { border-color: #19c7b0; box-shadow: 0 0 0 3px rgba(25,199,176,.1); }
        .pg-password-wrap input { flex: 1; width: 0; border: 0; background: transparent; box-shadow: none; }
        .pg-show-password { padding: 7px 0; color: #19c7b0; background: transparent; border: 0; font-size: 11px; font-weight: 750; }
        .pg-submit { display: flex; justify-content: center; align-items: center; width: 100%; min-height: 46px; margin-top: 5px; padding: 13px; color: #07141c; background: #19c7b0; border: 0; border-radius: 10px; font-size: 13px; font-weight: 800; }
        .pg-submit:hover:not(:disabled) { background: #36dec7; }
        .pg-error { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 18px; padding: 12px; color: #fca5a5; background: rgba(127,29,29,.18); border: 1px solid rgba(248,113,113,.3); border-radius: 10px; font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
        .pg-error-icon { display: grid; flex-shrink: 0; place-items: center; width: 18px; height: 18px; background: rgba(248,113,113,.16); border-radius: 50%; font-weight: 800; }
        .pg-security-note { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 22px; color: #94a3b8; font-size: 11px; text-align: center; }
        .pg-security-note span, .pg-switch-copy button { color: #19c7b0; }
        .pg-switch-copy { margin: 20px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.7; text-align: center; }
        .pg-switch-copy button { padding: 0; background: transparent; border: 0; font-size: inherit; font-weight: 750; }
        .pg-disclaimer { margin: 23px 0 0; padding-top: 17px; color: #64748b; border-top: 1px solid #26364b; font-size: 10px; line-height: 1.7; text-align: center; }
        .pg-auth button:focus-visible { outline: 2px solid #19c7b0; outline-offset: 3px; }
        @media (max-width: 480px) { .pg-auth { padding: 18px 12px; } .pg-auth-card { padding: 25px 20px; border-radius: 18px; } .pg-auth-card h1 { font-size: 24px; } }
      `}</style>
     <section className="pg-auth-card">
        <div className="pg-brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="31" height="31" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" />
            <path d="m8.5 12 2.2 2.2 4.8-5" />
          </svg>
        </div>

        <div className="pg-brand-name">phishguard<span>.ai</span></div>
        <div className="pg-eyebrow">AI-POWERED THREAT PROTECTION</div>
        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="pg-subtitle">
          {isRegister
            ? "Create an account to access your security workspace."
            : "Sign in to continue to your security workspace."}
        </p>

        <div className="pg-tabs" role="tablist" aria-label="Authentication">
          <button type="button" role="tab" aria-selected={!isRegister} className={`pg-tab ${!isRegister ? "active" : ""}`} onClick={() => switchMode("login")} disabled={busy}>
            Sign in
          </button>
          <button type="button" role="tab" aria-selected={isRegister} className={`pg-tab ${isRegister ? "active" : ""}`} onClick={() => switchMode("register")} disabled={busy}>
            Create account
          </button>
        </div>
        {(error || sessionError) && (
          <div className="pg-error" role="alert">
            <span className="pg-error-icon" aria-hidden="true">!</span>
            <div>{error || sessionError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <div className="pg-field">
              <label htmlFor="pg-name">Full name</label>
              <input id="pg-name" name="name" type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required disabled={busy} />
            </div>
          )}

          <div className="pg-field">
            <label htmlFor="pg-email">Email address</label>
            <input id="pg-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required disabled={busy} />
          </div>

          <div className="pg-field">
            <label htmlFor="pg-password">Password</label>
            <div className="pg-password-wrap">
              <input id="pg-password" name="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "At least 8 characters" : "Enter your password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={isRegister ? 8 : undefined} required disabled={busy} />
              <button type="button" className="pg-show-password" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} disabled={busy}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="pg-field">
              <label htmlFor="pg-confirm-password">Confirm password</label>
              <input id="pg-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Enter your password again" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required disabled={busy} />
            </div>
          )}

          <button type="submit" className="pg-submit" disabled={busy}>
            {busy ? "Please wait..." : isRegister ? "Create account →" : "Sign in securely →"}
          </button>
        </form>

        <div className="pg-security-note">
          <span aria-hidden="true">▣</span>
          Protected session · PhishGuard AI
        </div>

        <p className="pg-switch-copy">
          {isRegister ? "Already have an account? " : "New to PhishGuard AI? "}
          <button type="button" onClick={() => switchMode(isRegister ? "login" : "register")} disabled={busy}>
            {isRegister ? "Sign in" : "Create an account"}
          </button>
        </p>

        <p className="pg-disclaimer">
          Educational security prototype. Always verify suspicious messages independently.
        </p>
      </section>
    </main>
  );
}

