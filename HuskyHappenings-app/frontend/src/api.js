const API_BASE = "https://localhost:5000/api";

async function handleResponse(response) {
  const data = await response.json();
  return data;
}

// Author: Arianna Kelsey
export async function fetchEvents() {
  const response = await fetch("http://localhost:5000/api/events", {
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function createEvent(formData) {
  const response = await fetch("http://localhost:5000/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function updateEvent(id, formData) {
  const response = await fetch(`http://localhost:5000/api/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function cancelEvent(id, cancellationReason) {
  const response = await fetch(`http://localhost:5000/api/events/${id}/cancel`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ cancellationReason }),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function deleteEvent(id) {
  const response = await fetch(`http://localhost:5000/api/events/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function registerForEvent(id, rsvpStatus) {
  const response = await fetch(`http://localhost:5000/api/events/${id}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ rsvpStatus }),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function updateEventRegistration(id, rsvpStatus, registrationStatus = "Responded") {
  const response = await fetch(`http://localhost:5000/api/events/${id}/register`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ rsvpStatus, registrationStatus }),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function fetchJobs() {
  const response = await fetch("http://localhost:5000/api/jobs", {
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function fetchMyJobApplications() {
  const response = await fetch("http://localhost:5000/api/my-job-applications", {
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function createJob(formData) {
  const response = await fetch("http://localhost:5000/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function updateJob(id, formData) {
  const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function closeJob(id) {
  const response = await fetch(`http://localhost:5000/api/jobs/${id}/close`, {
    method: "PUT",
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function deleteJob(id) {
  const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function applyToJob(id, coverLetter, resumeURL) {
  const response = await fetch(`http://localhost:5000/api/jobs/${id}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ coverLetter, resumeURL }),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function updateJobApplicationStatus(applicationId, applicationStatus) {
  const response = await fetch(`http://localhost:5000/api/job-applications/${applicationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ applicationStatus }),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function deleteJobApplication(applicationId) {
  const response = await fetch(`http://localhost:5000/api/job-applications/${applicationId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function fetchMentorships() {
  const response = await fetch("http://localhost:5000/api/mentorships", {
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function createMentorship(formData) {
  const response = await fetch("http://localhost:5000/api/mentorships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function updateMentorship(id, formData) {
  const response = await fetch(`http://localhost:5000/api/mentorships/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function deactivateMentorship(id) {
  const response = await fetch(`http://localhost:5000/api/mentorships/${id}/deactivate`, {
    method: "PUT",
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function deleteMentorship(id) {
  const response = await fetch(`http://localhost:5000/api/mentorships/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function fetchMentorRequests() {
  const response = await fetch("http://localhost:5000/api/mentorship-requests", {
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function fetchMyMentorshipRequests() {
  const response = await fetch("http://localhost:5000/api/my-mentorship-requests", {
    credentials: "include",
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function createMentorRequest(formData) {
  const response = await fetch("http://localhost:5000/api/mentorship-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function updateMentorRequest(formData) {
  const response = await fetch("http://localhost:5000/api/mentorship-requests", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });
  return response.json();
}
// Author: Arianna Kelsey
export async function deleteMentorRequest(formData) {
  const response = await fetch("http://localhost:5000/api/mentorship-requests", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });
  return response.json();
}

