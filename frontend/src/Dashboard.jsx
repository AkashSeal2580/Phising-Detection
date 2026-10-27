
import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  FileSearch,
  Fingerprint,
  Globe,
  LayoutDashboard,
  Link2,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Radar,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { scanURL, scanEmail } from "./services/api";

const STORAGE_KEY = "phishguard_scan_history";

const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, group: "OVERVIEW" },
  { name: "URL Scanner", icon: Link2, group: "DETECTION" },
  { name: "Email Scanner", icon: Mail, group: "DETECTION" },
  { name: "Scan History", icon: Clock3, group: "MANAGEMENT" },
  { name: "Settings", icon: Settings, group: "MANAGEMENT" },
];

function loadHistory(storageKey = STORAGE_KEY) {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function isPhishing(prediction) {
  return String(prediction || "").toLowerCase().includes("phishing");
}

function getScore(score) {
  const number = Number(score);
  return Number.isFinite(number)
    ? Math.max(0, Math.min(100, number))
    : 0;
}

function formatDate(date) {
  if (!date) return "—";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString();
}

function getUserInitials(user) {
  const source = String(user?.name || user?.email || "User").trim();
  const parts = source.includes("@") ? [source.split("@")[0]] : source.split(/\s+/);
  const initials = parts
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  return initials || "U";
}

function truncate(text, length = 66) {
  const value = String(text || "");
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

function RiskBadge({ prediction }) {
  const risky = isPhishing(prediction);

  return (
    <span className={`risk-badge ${risky ? "danger" : "success"}`}>
      {risky ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
      {prediction || "Unknown"}
    </span>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "teal",
  trend,
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{title}</span>
        <span className={`stat-icon ${color}`}>
          <Icon size={19} />
        </span>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-bottom">
        <span className="stat-subtitle">{subtitle}</span>
        {trend && <span className="stat-trend">{trend}</span>}
      </div>
    </article>
  );
}

function PanelHeading({ eyebrow, title, icon: Icon, action }) {
  return (
    <div className="panel-heading">
      <div>
        {eyebrow && <div className="mini-eyebrow">{eyebrow}</div>}
        <h2>
          {Icon && <Icon size={18} />}
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function ActivityChart({ history }) {
  const days = useMemo(() => {
    const result = [];

    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const scans = history.filter((item) => {
        const time = new Date(item.scannedAt).getTime();
        return time >= date.getTime() && time < nextDate.getTime();
      });

      result.push({
        key: date.toISOString(),
        label: date.toLocaleDateString(undefined, {
          weekday: "short",
        }),
        url: scans.filter((item) => item.type === "URL").length,
        email: scans.filter((item) => item.type === "Email").length,
      });
    }

    return result;
  }, [history]);

  const maximum = Math.max(
    4,
    ...days.map((day) => day.url + day.email)
  );

  return (
    <div className="activity-chart">
      <div className="chart-legend">
        <span><i className="legend-dot teal-dot" /> URL scans</span>
        <span><i className="legend-dot purple-dot" /> Email scans</span>
      </div>

      <div className="bar-chart">
        {days.map((day) => {
          const urlHeight = (day.url / maximum) * 100;
          const emailHeight = (day.email / maximum) * 100;

          return (
            <div className="bar-column" key={day.key}>
              <div className="bar-value">
                {day.url + day.email > 0
                  ? day.url + day.email
                  : ""}
              </div>

              <div className="bar-track">
                <div
                  className="bar-stack"
                  title={`${day.url} URL scans, ${day.email} email scans`}
                >
                  <div
                    className="bar-segment purple-bar"
                    style={{ height: `${emailHeight}%` }}
                  />
                  <div
                    className="bar-segment teal-bar"
                    style={{ height: `${urlHeight}%` }}
                  />
                </div>
              </div>

              <span className="bar-label">{day.label}</span>
            </div>
          );
        })}
      </div>

      {history.length === 0 && (
        <p className="chart-empty">
          Your activity chart will populate as you complete scans.
        </p>
      )}
    </div>
  );
}

function ThreatBreakdown({ history }) {
  const urlCount = history.filter((item) => item.type === "URL").length;
  const emailCount = history.filter((item) => item.type === "Email").length;
  const total = history.length || 1;

  const urlPercent = Math.round((urlCount / total) * 100);
  const emailPercent = 100 - urlPercent;

  return (
    <div className="breakdown-content">
      <div
        className="donut-chart"
        style={{
          background: `conic-gradient(#19c7b0 0% ${urlPercent}%, #8b7bff ${urlPercent}% 100%)`,
        }}
      >
        <div className="donut-center">
          <b>{history.length}</b>
          <span>Total scans</span>
        </div>
      </div>

      <div className="breakdown-legend">
        <div className="breakdown-item">
          <span className="legend-dot teal-dot" />
          <div>
            <span>URL scans</span>
            <b>{urlCount}</b>
          </div>
          <small>{urlCount ? `${urlPercent}%` : "0%"}</small>
        </div>

        <div className="breakdown-item">
          <span className="legend-dot purple-dot" />
          <div>
            <span>Email scans</span>
            <b>{emailCount}</b>
          </div>
          <small>{emailCount ? `${emailPercent}%` : "0%"}</small>
        </div>
      </div>
    </div>
  );
}

function ScanForm({
  kind,
  value,
  setValue,
  onScan,
  busy,
  result,
  error,
}) {
  const isURL = kind === "url";

  return (
    <div className="scanner-layout">
      <section className="panel scanner-panel">
        <div className="scanner-intro-icon">
          {isURL ? <Globe size={24} /> : <Mail size={24} />}
        </div>

        <div className="mini-eyebrow">
          {isURL ? "LINK INTELLIGENCE" : "MESSAGE INTELLIGENCE"}
        </div>

        <h2>{isURL ? "Inspect a suspicious URL" : "Analyze an email"}</h2>

        <p className="muted-copy">
          {isURL
            ? "Evaluate a link using your connected machine-learning API. The submitted URL is analyzed as text and is not opened by this interface."
            : "Check an email message for patterns associated with phishing. Avoid including passwords, OTPs, or private information."}
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onScan();
          }}
        >
          <label htmlFor={isURL ? "scan-url" : "scan-email"}>
            {isURL ? "URL to inspect" : "Email content"}
          </label>

          {isURL ? (
            <div className="url-input-wrap">
              <Link2 size={18} />
              <input
                id="scan-url"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="https://example.com/login"
                autoComplete="url"
              />
              {value && (
                <button
                  className="input-clear"
                  type="button"
                  onClick={() => setValue("")}
                  aria-label="Clear URL"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ) : (
            <textarea
              id="scan-email"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              rows={9}
              maxLength={20000}
              placeholder={"Paste the email subject and message here...\n\nExample: Your account will be blocked. Verify your details immediately."}
            />
          )}

          <div className="input-meta">
            <span>
              <LockKeyhole size={13} />
              Analyzed by your local API
            </span>
            {!isURL && <span>{value.length}/20000</span>}
          </div>

          <button
            type="submit"
            className="primary-btn scan-submit"
            disabled={busy || !value.trim()}
          >
            {busy ? (
              <>
                <LoaderCircle className="spin" size={17} />
                Analyzing...
              </>
            ) : (
              <>
                <Radar size={17} />
                Analyze {isURL ? "URL" : "email"}
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="inline-error">
            <AlertTriangle size={17} />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className={`scan-result ${isPhishing(result.prediction) ? "result-danger" : "result-success"}`}>
            <div className="result-title">
              {isPhishing(result.prediction) ? (
                <AlertOctagon size={22} />
              ) : (
                <ShieldCheck size={22} />
              )}
              <div>
                <span className="mini-eyebrow">SCAN COMPLETE</span>
                <h3>{result.prediction || "Analysis completed"}</h3>
              </div>
            </div>

            <div className="result-score-row">
              <span>Model risk score</span>
              <b>
                {result.risk_score == null
                  ? "N/A"
                  : `${result.risk_score}%`}
              </b>
            </div>

            {result.warning && <p>{result.warning}</p>}
            {result.disclaimer && (
              <small className="muted-copy">{result.disclaimer}</small>
            )}
          </div>
        )}
      </section>

      <aside className="scanner-side">
        <div className="panel guidance-panel">
          <span className="guidance-icon"><ShieldCheck size={21} /></span>
          <h3>What this scan does</h3>
          <p>
            Your existing FastAPI service receives the input and returns a
            model prediction. This frontend does not visit submitted links.
          </p>

          <div className="guidance-divider" />

          <div className="guidance-row">
            <Check size={16} />
            <span>Automated model prediction</span>
          </div>
          <div className="guidance-row">
            <Check size={16} />
            <span>Result added to scan history</span>
          </div>
          <div className="guidance-row">
            <Check size={16} />
            <span>History saved in this browser</span>
          </div>
        </div>

        <div className="notice-card">
          <ShieldAlert size={19} />
          <div>
            <b>Use caution</b>
            <p>
              A low risk score does not guarantee that a link or message
              is safe. Your current prototype uses demo-trained models.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const userStorageKey = `${STORAGE_KEY}:${String(user?.id ?? user?.email ?? "default").toLowerCase()}`;
  const displayName = user?.name || user?.full_name || user?.email || "Account";
  const displayEmail = user?.email || "Signed in";
  const initials = getUserInitials(user);

  const [page, setPage] = useState("Dashboard");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [resultKind, setResultKind] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [history, setHistory] = useState(() => loadHistory(userStorageKey));
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("All");
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(history));
    } catch (storageError) {
      console.error("Could not persist scan history:", storageError);
    }
  }, [history, userStorageKey]);

  const stats = useMemo(() => {
    const phishing = history.filter((item) =>
      isPhishing(item.prediction)
    );

    const urlCount = history.filter((item) => item.type === "URL").length;
    const emailCount = history.filter((item) => item.type === "Email").length;

    return {
      total: history.length,
      url: urlCount,
      email: emailCount,
      threats: phishing.length,
    };
  }, [history]);

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    return history.filter((item) => {
      const matchesType =
        historyFilter === "All" || item.type === historyFilter;

      const matchesSearch =
        !query ||
        String(item.input || "").toLowerCase().includes(query) ||
        String(item.prediction || "").toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [history, historySearch, historyFilter]);

  async function runScan(kind) {
    const input = kind === "url" ? url.trim() : email.trim();

    if (!input) {
      setError(`Please ${kind === "url" ? "enter a URL" : "paste email text"} first.`);
      return;
    }

    setError("");
    setResult(null);
    setResultKind("");
    setBusy(true);

    try {
      const response =
        kind === "url"
          ? await scanURL(input)
          : await scanEmail(input);

      setResult(response);
      setResultKind(kind);

      const entry = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        type: kind === "url" ? "URL" : "Email",
        input,
        prediction: response.prediction ?? "Unknown",
        risk_score: response.risk_score ?? null,
        warning: response.warning ?? "",
        scannedAt: new Date().toISOString(),
      };

      setHistory((previous) => [entry, ...previous]);
      setToast("Scan completed and added to history.");

      window.setTimeout(() => setToast(""), 3000);
    } catch (exception) {
      console.error("Scan failed:", exception);
      setError(
        `${exception.message || "Request failed"}. Check that FastAPI is running and the API URL is correct.`
      );
    } finally {
      setBusy(false);
    }
  }

  function navigate(nextPage) {
    setPage(nextPage);
    setError("");
    setResult(null);
    setResultKind("");
    setMobileNavOpen(false);
  }

  function clearHistory() {
    if (!window.confirm("Delete all saved scan history from this browser?")) {
      return;
    }

    setHistory([]);
    setToast("Scan history cleared.");
    window.setTimeout(() => setToast(""), 3000);
  }

  async function copyInput(input) {
    try {
      await navigator.clipboard.writeText(input);
      setToast("Copied to clipboard.");
      window.setTimeout(() => setToast(""), 2500);
    } catch {
      setToast("Clipboard access is unavailable in this browser.");
      window.setTimeout(() => setToast(""), 3000);
    }
  }

  const currentNav = NAV_ITEMS.find((item) => item.name === page);

  return (
    <div className="app-shell">
      {mobileNavOpen && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><ShieldCheck size={24} /></span>
          <span>phishguard<span className="brand-ai">.ai</span></span>
        </div>

        <div className="workspace-switch">
          <div className="workspace-avatar"><Fingerprint size={18} /></div>
          <div className="workspace-info">
            <b>Security workspace</b>
            <span>Local environment</span>
          </div>
          <ChevronDown size={15} />
        </div>

        {["OVERVIEW", "DETECTION", "MANAGEMENT"].map((group) => (
          <div className="nav-group" key={group}>
            <div className="nav-label">{group}</div>
            {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  className={`nav-item ${page === item.name ? "nav-active" : ""}`}
                  onClick={() => navigate(item.name)}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{item.name}</span>
                  {item.name === "Scan History" && history.length > 0 && (
                    <span className="nav-count">{history.length}</span>
                  )}
                  {page === item.name && <span className="active-line" />}
                </button>
              );
            })}
          </div>
        ))}

        <div className="sidebar-spacer" />

        <div className="protection-card">
          <div className="protection-top">
            <span className="live-dot" />
            <span>LOCAL PROTOTYPE</span>
          </div>
          <div className="protection-icon"><Shield size={23} /></div>
          <b>Stay one step ahead.</b>
          <p>Inspect suspicious content before you trust it.</p>
          <button onClick={() => navigate("URL Scanner")}>
            Start a scan <ArrowRight size={15} />
          </button>
        </div>

        <div className="sidebar-footer">
          <span className="footer-avatar">{initials}</span>
          <div className="sidebar-user-info">
            <b title={displayName}>{truncate(displayName, 22)}</b>
            <span title={displayEmail}>{truncate(displayEmail, 28)}</span>
          </div>
          <span className="footer-status" title="Signed-in session" />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumbs">
              <span>Workspace</span>
              <span className="crumb-separator">/</span>
              <b>{page}</b>
            </div>
          </div>

          <div className="topbar-right">
            <span className="environment-pill">
              <span className="live-dot" /> SYSTEM ONLINE
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              title="Refresh current page"
              onClick={() => {
                setError("");
                setResult(null);
                setResultKind("");
              }}
            >
              <RefreshCw size={17} />
            </button>
            <span className="top-avatar" title={displayEmail}>{initials}</span>
            {typeof onLogout === "function" && (
              <button
                type="button"
                className="outline-btn dashboard-logout"
                onClick={onLogout}
                title="Sign out of PhishGuard AI"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
          <div className="page-title-row">
            <div>
              <div className="page-eyebrow">
                <span className="eyebrow-icon"><Sparkles size={13} /></span>
                THREAT ANALYSIS PLATFORM
              </div>
              <h1>
                {page === "Dashboard" ? "Security overview" : page}
              </h1>
              <p className="page-subtitle">
                {page === "Dashboard"
                  ? "Monitor your scanning activity and inspect suspicious content."
                  : page === "Scan History"
                    ? "Review, search, and manage your previous scan results."
                    : page === "URL Scanner"
                      ? "Analyze links and identify patterns associated with phishing."
                      : page === "Email Scanner"
                        ? "Inspect message content for potential phishing indicators."
                        : "Configure and review your local scanning workspace."}
              </p>
            </div>

            <div className="page-title-actions">
              {page === "Dashboard" && (
                <>
                  <button
                    className="outline-btn"
                    onClick={() => navigate("Email Scanner")}
                  >
                    <Mail size={16} /> Scan email
                  </button>
                  <button
                    className="primary-btn"
                    onClick={() => navigate("URL Scanner")}
                  >
                    <Radar size={16} /> New scan
                  </button>
                </>
              )}
            </div>
          </div>

          {page === "Dashboard" && (
            <>
              <div className="stat-grid">
                <StatCard
                  title="Total scans"
                  value={stats.total}
                  subtitle="Successful analyses"
                  icon={Activity}
                  color="teal"
                />
                <StatCard
                  title="URLs analyzed"
                  value={stats.url}
                  subtitle="Link inspection runs"
                  icon={Globe}
                  color="blue"
                />
                <StatCard
                  title="Emails analyzed"
                  value={stats.email}
                  subtitle="Message inspection runs"
                  icon={Mail}
                  color="purple"
                />
                <StatCard
                  title="Phishing predictions"
                  value={stats.threats}
                  subtitle="Flagged by the model"
                  icon={ShieldAlert}
                  color="orange"
                />
              </div>

              <div className="dashboard-grid">
                <section className="panel activity-panel">
                  <PanelHeading
                    eyebrow="SCAN TELEMETRY"
                    title="Scanning activity"
                    icon={BarChart3}
                    action={
                      <span className="period-pill">
                        <Activity size={13} /> Last 7 days
                      </span>
                    }
                  />
                  <p className="panel-description">
                    Completed scans by day, based on locally saved history.
                  </p>
                  <ActivityChart history={history} />
                </section>

                <section className="panel breakdown-panel">
                  <PanelHeading
                    eyebrow="DISTRIBUTION"
                    title="Scan breakdown"
                    icon={Radar}
                  />
                  <p className="panel-description">
                    Compare URL and email analysis volume.
                  </p>
                  <ThreatBreakdown history={history} />
                </section>
              </div>

              <section className="panel recent-panel">
                <PanelHeading
                  eyebrow="LATEST ACTIVITY"
                  title="Recent scans"
                  icon={Clock3}
                  action={
                    <button
                      className="text-btn"
                      onClick={() => navigate("Scan History")}
                    >
                      View all <ArrowRight size={15} />
                    </button>
                  }
                />

                {history.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><FileSearch size={25} /></div>
                    <h3>Your security activity starts here</h3>
                    <p>Run your first URL or email scan to populate the dashboard.</p>
                    <div className="empty-actions">
                      <button className="primary-btn" onClick={() => navigate("URL Scanner")}>
                        <Link2 size={16} /> Scan a URL
                      </button>
                      <button className="outline-btn" onClick={() => navigate("Email Scanner")}>
                        <Mail size={16} /> Scan an email
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="scan-table">
                      <thead>
                        <tr>
                          <th>TYPE</th>
                          <th>SCANNED INPUT</th>
                          <th>MODEL RESULT</th>
                          <th>RISK SCORE</th>
                          <th>TIME</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice(0, 5).map((item) => (
                          <tr key={item.id}>
                            <td>
                              <span className="type-cell">
                                <span className={`type-icon ${item.type === "URL" ? "url-type" : "email-type"}`}>
                                  {item.type === "URL" ? <Link2 size={15} /> : <Mail size={15} />}
                                </span>
                                {item.type}
                              </span>
                            </td>
                            <td>
                              <span className="table-input" title={item.input}>
                                {truncate(item.input, 46)}
                              </span>
                            </td>
                            <td><RiskBadge prediction={item.prediction} /></td>
                            <td className="score-cell">
                              {item.risk_score == null ? "—" : `${item.risk_score}%`}
                            </td>
                            <td className="date-cell">{formatDate(item.scannedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {(page === "URL Scanner" || page === "Email Scanner") && (
            <ScanForm
              kind={page === "URL Scanner" ? "url" : "email"}
              value={page === "URL Scanner" ? url : email}
              setValue={page === "URL Scanner" ? setUrl : setEmail}
              onScan={() => runScan(page === "URL Scanner" ? "url" : "email")}
              busy={busy}
              result={resultKind === (page === "URL Scanner" ? "url" : "email") ? result : null}
              error={error}
            />
          )}

          {page === "Scan History" && (
            <section className="panel history-panel">
              <PanelHeading
                eyebrow="SCAN ARCHIVE"
                title={`All scans (${filteredHistory.length})`}
                icon={Clock3}
                action={
                  history.length > 0 && (
                    <button className="outline-btn danger-outline" onClick={clearHistory}>
                      <Trash2 size={15} /> Clear history
                    </button>
                  )
                }
              />

              <div className="history-toolbar">
                <div className="search-box">
                  <Search size={17} />
                  <input
                    value={historySearch}
                    onChange={(event) => setHistorySearch(event.target.value)}
                    placeholder="Search scanned inputs or predictions..."
                  />
                  {historySearch && (
                    <button onClick={() => setHistorySearch("")} aria-label="Clear search">
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="filter-group">
                  {["All", "URL", "Email"].map((filter) => (
                    <button
                      key={filter}
                      className={`filter-btn ${historyFilter === filter ? "filter-active" : ""}`}
                      onClick={() => setHistoryFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="empty-state history-empty">
                  <div className="empty-state-icon"><Search size={24} /></div>
                  <h3>{history.length ? "No matching scans" : "No scans recorded yet"}</h3>
                  <p>
                    {history.length
                      ? "Try another search or filter."
                      : "Successful scans will be added here automatically."}
                  </p>
                  {history.length === 0 && (
                    <button className="primary-btn" onClick={() => navigate("URL Scanner")}>
                      <Radar size={16} /> Start scanning
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="scan-table">
                    <thead>
                      <tr>
                        <th>TYPE</th>
                        <th>SCANNED INPUT</th>
                        <th>MODEL RESULT</th>
                        <th>RISK SCORE</th>
                        <th>DATE & TIME</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span className="type-cell">
                              <span className={`type-icon ${item.type === "URL" ? "url-type" : "email-type"}`}>
                                {item.type === "URL" ? <Link2 size={15} /> : <Mail size={15} />}
                              </span>
                              {item.type}
                            </span>
                          </td>
                          <td>
                            <span className="table-input" title={item.input}>
                              {truncate(item.input, 52)}
                            </span>
                          </td>
                          <td><RiskBadge prediction={item.prediction} /></td>
                          <td className="score-cell">
                            {item.risk_score == null ? "—" : `${item.risk_score}%`}
                          </td>
                          <td className="date-cell">{formatDate(item.scannedAt)}</td>
                          <td>
                            <button
                              className="icon-button small-icon-button"
                              title="Copy scanned input"
                              onClick={() => copyInput(item.input)}
                            >
                              <Copy size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="history-footer">
                <span>
                  <LockKeyhole size={13} /> Stored in this browser only
                </span>
                <span>{filteredHistory.length} result(s)</span>
              </div>
            </section>
          )}

          {page === "Settings" && (
            <div className="settings-grid">
              <section className="panel settings-panel">
                <PanelHeading
                  eyebrow="CONNECTION"
                  title="API configuration"
                  icon={Activity}
                />
                <div className="setting-row">
                  <div>
                    <b>FastAPI backend</b>
                    <p>Existing backend connection used by this frontend.</p>
                  </div>
                  <span className="environment-pill">
                    <span className="live-dot" /> CONFIGURED
                  </span>
                </div>
                <div className="api-address">http://127.0.0.1:8000</div>
                <p className="panel-description">
                  The URL and email scanners continue to use your existing
                  functions from <code>src/services/api.js</code>.
                </p>
                <a
                  className="outline-btn settings-link"
                  href="http://127.0.0.1:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open API documentation <ExternalLink size={15} />
                </a>
              </section>

              <section className="panel settings-panel">
                <PanelHeading
                  eyebrow="LOCAL STORAGE"
                  title="Scan history"
                  icon={Clock3}
                />
                <div className="settings-stat">
                  <span>Saved scan records</span>
                  <b>{history.length}</b>
                </div>
                <p className="panel-description">
                  History is stored in your browser using localStorage.
                  It is not synced to MySQL or other devices.
                </p>
                <button
                  className="outline-btn"
                  onClick={() => navigate("Scan History")}
                >
                  View saved scans <ArrowRight size={15} />
                </button>
              </section>

              <section className="panel settings-panel settings-wide">
                <PanelHeading
                  eyebrow="MODEL INFORMATION"
                  title="Prototype limitations"
                  icon={ShieldAlert}
                />
                <div className="notice-card">
                  <AlertTriangle size={19} />
                  <div>
                    <b>Educational use only</b>
                    <p>
                      Model predictions and risk scores are not guarantees.
                      The demo-trained models may incorrectly classify
                      legitimate or malicious content. Do not use them as
                      the sole basis for security decisions.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          <footer className="page-footer">
            <span>PHISHGUARD AI <span className="footer-separator">/</span> SECURITY WORKSPACE</span>
            <span><ShieldCheck size={14} /> Educational prototype · Local history</span>
          </footer>
        </div>
      </main>

      {toast && (
        <div className="toast-message">
          <CheckCircle2 size={17} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss notification">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
