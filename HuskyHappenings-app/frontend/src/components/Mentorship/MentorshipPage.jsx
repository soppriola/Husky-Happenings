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
    const mentorshipData = await fetchMentorships();
    const requestData = await fetchMentorRequests();
    setMentorships(mentorshipData);
    setRequests(requestData);
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
    <div>
      <h2>Mentorship Program</h2>
      <p>Create mentorship opportunities and allow students to request mentorship.</p>

      <section className="split-section">
        <div>
          <h3>Create Mentorship Program</h3>
          <CreateMentorship
            formData={programForm}
            onChange={handleProgramChange}
            onSubmit={submitProgram}
          />
        </div>

        <div>
          <h3>Request a Mentor</h3>
          <RequestMentor
            formData={requestForm}
            onChange={handleRequestChange}
            onSubmit={submitRequest}
          />
        </div>
      </section>

      {message && <p className="message">{message}</p>}

      <h3>Available Mentorship Programs</h3>
      <div className="card-grid">
        {mentorships.map((item) => (
          <div className="feature-card" key={item.id}>
            <h4>{item.name}</h4>
            <p><strong>Mentor:</strong> {item.mentorName}</p>
            <p><strong>Focus Area:</strong> {item.focusArea}</p>
            <p><strong>Description:</strong> {item.description}</p>
            <p><strong>Meeting Style:</strong> {item.meetingStyle}</p>
          </div>
        ))}
      </div>

      <h3>Mentorship Requests</h3>
      <div className="card-grid">
        {requests.map((item) => (
          <div className="feature-card" key={item.id}>
            <h4>{item.studentName}</h4>
            <p><strong>Interest Area:</strong> {item.interestArea}</p>
            <p><strong>Goal:</strong> {item.goal}</p>
            <p><strong>Status:</strong> {item.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
