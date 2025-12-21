const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function fetchNotes() {
  const res = await fetch(`${API_BASE}/demo/notes`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default { fetchNotes };
const API_BASE = "http://127.0.0.1:8000";

export async function registerUser(data) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginUser(data) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
