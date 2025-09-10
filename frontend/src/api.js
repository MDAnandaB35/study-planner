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

export function updatePlan(id, data) {
  return request(`/ai/plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deletePlan(id) {
  return request(`/ai/plans/${id}`, {
    method: "DELETE"
  });
}

// Milestone CRUD
export function addMilestone(planId, data) {
  return request(`/ai/plans/${planId}/milestones`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateMilestone(id, data) {
  return request(`/ai/milestones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteMilestone(id) {
  return request(`/ai/milestones/${id}`, {
    method: "DELETE"
  });
}

// Step CRUD
export function addStep(milestoneId, data) {
  return request(`/ai/milestones/${milestoneId}/steps`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateStep(id, data) {
  return request(`/ai/steps/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteStep(id) {
  return request(`/ai/steps/${id}`, {
    method: "DELETE"
  });
}

// Resource CRUD
export function addResource(stepId, data) {
  return request(`/ai/steps/${stepId}/resources`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateResource(id, data) {
  return request(`/ai/resources/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteResource(id) {
  return request(`/ai/resources/${id}`, {
    method: "DELETE"
  });
}

// Public plans
export function getPublicPlans() {
  return request("/ai/plans/public");
}

export function getPublicPlanById(id) {
  return request(`/ai/plans/public/${id}`);
}

// Bookmarks & Progress (public plans)
export function bookmarkPlan(id) {
  return request(`/ai/public/plans/${id}/bookmark`, { method: "POST" });
}

export function unbookmarkPlan(id) {
  return request(`/ai/public/plans/${id}/bookmark`, { method: "DELETE" });
}

export function listBookmarks() {
  return request(`/ai/bookmarks`);
}

export function getPublicPlanProgress(id) {
  return request(`/ai/public/plans/${id}/progress`);
}

export function setPublicPlanProgress(id, milestone_id, completed) {
  return request(`/ai/public/plans/${id}/progress`, {
    method: "POST",
    body: JSON.stringify({ milestone_id, completed })
  });
}

export default {
  signup,
  login,
  getMe,
  logout,
  generateRoadmap,
  getLatestPlan,
  listPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  addStep,
  updateStep,
  deleteStep,
  addResource,
  updateResource,
  deleteResource,
  getPublicPlans,
  getPublicPlanById,
  bookmarkPlan,
  unbookmarkPlan,
  listBookmarks,
  getPublicPlanProgress,
  setPublicPlanProgress
};


