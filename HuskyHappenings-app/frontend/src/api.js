const API_BASE = "http://127.0.0.1:5000/api";

async function handleResponse(response) {
  const data = await response.json();
  return data;
}

export async function fetchEvents() {
  const response = await fetch(`${API_BASE}/events`);
  return handleResponse(response);
}

export async function createEvent(eventData) {
  const response = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  return handleResponse(response);
}

export async function fetchJobs() {
  const response = await fetch(`${API_BASE}/jobs`);
  return handleResponse(response);
}

export async function createJob(jobData) {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobData),
  });
  return handleResponse(response);
}

export async function fetchMentorships() {
  const response = await fetch(`${API_BASE}/mentorships`);
  return handleResponse(response);
}

export async function createMentorship(mentorshipData) {
  const response = await fetch(`${API_BASE}/mentorships`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mentorshipData),
  });
  return handleResponse(response);
}

export async function fetchMentorRequests() {
  const response = await fetch(`${API_BASE}/mentorship-requests`);
  return handleResponse(response);
}

export async function createMentorRequest(requestData) {
  const response = await fetch(`${API_BASE}/mentorship-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  });
  return handleResponse(response);
}
