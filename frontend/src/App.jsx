import React, { useCallback, useEffect, useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

// IMPORTANT: use the same hostname in Login.jsx and App.jsx.
// Set VITE_API_BASE_URL=http://localhost:8000 in frontend/.env.
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

async function readResponse(response) {
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

    throw new Error(`Request failed (${response.status}): ${message}`);
  }
 return data;
}

async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    console.error(`Network request failed: ${path}`, error);
    throw new Error(
      `Cannot connect to FastAPI at ${API_BASE}. Check that the backend is running and CORS allows your frontend origin.`
    );
  }

  return readResponse(response);
}

function normalizeUser(data) {
  const user = data?.user ?? data;

  if (
    !user ||
    typeof user !== "object" ||
    Array.isArray(user) ||
    typeof user.email !== "string" ||
    !user.email.trim()
  ) {
    throw new Error(
      "The authentication response does not contain a valid user email."
    );
  }

  return {
    ...user,
    id: user.id ?? user.user_id ?? user.email,
    name: user.name ?? user.full_name ?? user.email.split("@")[0],
    email: user.email,
  };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const checkSession = useCallback(async () => {
    setCheckingSession(true);
    setSessionError("");
try {
      const data = await apiRequest("/api/auth/me", { method: "GET" });
      setUser(normalizeUser(data));
    } catch (error) {
      setUser(null);

      // A 401 on initial load simply means the visitor is not logged in.
      if (!error.message?.includes("Request failed (401)")) {
        console.error("Session verification failed:", error);
        setSessionError(error.message || "Could not verify your session.");
      }
    } finally {
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Login.jsx calls this only after POST /api/auth/login succeeds.
  const handleAuthenticated = useCallback(async () => {
    const data = await apiRequest("/api/auth/me", { method: "GET" });
    const authenticatedUser = normalizeUser(data);
    setSessionError("");
    setUser(authenticatedUser);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      setUser(null);
      setSessionError("");
    } catch (error) {
      console.error("Logout failed:", error);

      if (error.message?.includes("Request failed (401)")) {
        setUser(null);
        setSessionError("");
      } else {
        setSessionError(`Logout failed: ${error.message}`);
      }
    }
  }, []);
  if (checkingSession) {
    return (
      <div style={styles.screen}>
        <style>{`
          @keyframes phishguard-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div style={styles.card}>
          <div style={styles.logo}>⬡</div>
          <h2 style={styles.heading}>PhishGuard AI</h2>
          <p style={styles.muted}>Verifying your secure session...</p>
          <div
            style={styles.spinner}
            role="status"
            aria-label="Verifying session"
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={handleAuthenticated}
        sessionError={sessionError}
      />
    );
  }

  return <Dashboard key={user.id} user={user} onLogout={handleLogout} />;
}

const styles = {
  screen: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#080F1D",
    color: "#F1F5F9",
    fontFamily: "Inter, system-ui, sans-serif",
    padding: 24,
  },
  card: {
    textAlign: "center",
    padding: 32,
    border: "1px solid #253449",
    borderRadius: 20,
    background: "#101B2D",
    width: "min(100%, 340px)",
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    margin: "0 auto",
    display: "grid",
    placeItems: "center",
    background: "rgba(25,199,176,0.12)",
    color: "#19C7B0",
    fontSize: 36,
  },
  heading: { marginTop: 18, marginBottom: 8 },
  muted: { color: "#94A3B8", fontSize: 13 },
  spinner: {
    width: 24,
    height: 24,
    border: "3px solid #26364B",
    borderTopColor: "#19C7B0",
    borderRadius: "50%",
    margin: "24px auto 0",
    animation: "phishguard-spin 0.8s linear infinite",
  },
};
