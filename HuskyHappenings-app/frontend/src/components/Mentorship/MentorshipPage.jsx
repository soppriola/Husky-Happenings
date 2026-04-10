import React, { useEffect, useState } from "react";
import {
  fetchMentorships,
  createMentorship,
  fetchMentorRequests,
  createMentorRequest,
} from "../../api";
import CreateMentorship from "./CreateMentorship";
import RequestMentor from "./RequestMentor";

export default function MentorshipPage() {
  const [mentorships, setMentorships] = useState([]);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");

  const [programForm, setProgramForm] = useState({
    name: "",
    mentorName: "",
    focusArea: "",
    description: "",
    meetingStyle: "Virtual",
  });

  const [requestForm, setRequestForm] = useState({
    studentName: "",
    interestArea: "",
    goal: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const mentorshipData = await fetchMentorships();
      const requestData = await fetchMentorRequests();

      setMentorships(Array.isArray(mentorshipData) ? mentorshipData : []);
      setRequests(Array.isArray(requestData) ? requestData : []);
    } catch (error) {
      console.error("Failed to load mentorship data:", error);
      setMentorships([]);
      setRequests([]);
    }
  }

  function handleProgramChange(event) {
    const { name, value } = event.target;
    setProgramForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleRequestChange(event) {
    const { name, value } = event.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitProgram(event) {
    event.preventDefault();
    setMessage("");

    const result = await createMentorship(programForm);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Mentorship program created successfully.");
    setProgramForm({
      name: "",
      mentorName: "",
      focusArea: "",
      description: "",
      meetingStyle: "Virtual",
    });

    loadData();
  }

  async function submitRequest(event) {
    event.preventDefault();
    setMessage("");

    const result = await createMentorRequest(requestForm);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Mentorship request submitted successfully.");
    setRequestForm({
      studentName: "",
      interestArea: "",
      goal: "",
    });

    loadData();
  }

  return (
    <div className="mentorship-page">
      <div className="mentorship-header">
        <h1>Mentorship Program</h1>
        <p>Create mentorship opportunities and allow students to request support.</p>
      </div>

      <section className="mentorship-section">
        <div className="mentorship-split">
          <div className="mentorship-panel">
            <h2>Create Mentorship Program</h2>
            <CreateMentorship
              formData={programForm}
              onChange={handleProgramChange}
              onSubmit={submitProgram}
            />
          </div>

          <div className="mentorship-panel">
            <h2>Request a Mentor</h2>
            <RequestMentor
              formData={requestForm}
              onChange={handleRequestChange}
              onSubmit={submitRequest}
            />
          </div>
        </div>

        {message && <p className="mentorship-message">{message}</p>}
      </section>

      <section className="mentorship-section">
        <div className="mentorship-list-header">
          <h2>Available Mentorship Programs</h2>
          <button type="button" onClick={loadData} className="refresh-button">
            Refresh
          </button>
        </div>

        {mentorships.length === 0 ? (
          <p className="empty-state">No mentorship programs available yet.</p>
        ) : (
          <div className="mentorship-card-grid">
            {mentorships.map((item) => (
              <div className="mentorship-card" key={item.id}>
                <div className="mentorship-card-top">
                  <h3>{item.name}</h3>
                  <span className="mentorship-badge">{item.meetingStyle}</span>
                </div>
                <p><strong>Mentor:</strong> {item.mentorName}</p>
                <p><strong>Focus Area:</strong> {item.focusArea}</p>
                <p className="mentorship-description">
                  {item.description || "No description provided."}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mentorship-section">
        <h2>Mentorship Requests</h2>

        {requests.length === 0 ? (
          <p className="empty-state">No mentorship requests submitted yet.</p>
        ) : (
          <div className="mentorship-card-grid">
            {requests.map((item) => (
              <div className="mentorship-card" key={item.id}>
                <div className="mentorship-card-top">
                  <h3>{item.studentName}</h3>
                  <span className="mentorship-badge">{item.status}</span>
                </div>
                <p><strong>Interest Area:</strong> {item.interestArea}</p>
                <p className="mentorship-description">
                  <strong>Goal:</strong> {item.goal}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
