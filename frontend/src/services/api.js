const BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
async function post(path, payload) {
  const response = await fetch(`${BASE}${path}`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Request failed: ${response.status}`);
  return data;
}
export const scanURL = url => post("/api/scan/url", {url});
export const scanEmail = email_text => post("/api/scan/email", {email_text});
