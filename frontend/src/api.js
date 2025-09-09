const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options,
  });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    const errorMessage = data?.error || res.statusText;
    throw new Error(errorMessage);
  }
  return data;
}

export function signup(email, password) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function getMe() {
  return request("/auth/me");
}

export function logout() {
  return request("/auth/logout", { method: "POST" });
}

export function generateRoadmap(focus, outcome) {
  return request("/ai/complete", {
    method: "POST",
    body: JSON.stringify({ focus, outcome })
  });
}

export function getLatestPlan() {
  return request("/ai/plans/latest");
}

export function listPlans() {
  return request("/ai/plans");
}

export function getPlanById(id) {
  return request(`/ai/plans/${id}`);
}

export default {
  signup,
  login,
  getMe,
  logout,
  generateRoadmap,
  getLatestPlan,
  listPlans,
  getPlanById
};


