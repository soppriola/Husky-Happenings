// Author: Arianna Kelsey

import React, { useEffect, useState } from "react";
import {
  fetchMentorships,
  createMentorship,
  updateMentorship,
  deactivateMentorship,
  deleteMentorship,
  fetchMentorRequests,
  createMentorRequest,
  updateMentorRequest,
  deleteMentorRequest,
  fetchMyMentorshipRequests,
} from "../../api";
import CreateMentorship from "./CreateMentorship";
import RequestMentor from "./RequestMentor";

const emptyProgramForm = {
  name: "",
  focusArea: "",
  description: "",
  privacyType: "Public",
  isActive: true,
};

const emptyRequestForm = {
  programID: "",
  roleType: "Member",
  membershipStatus: "Pending",
};

function canManage(item) {
  return item.canManage === 1 || item.canManage === true || item.canManage === "1";
}

export default function MentorshipPage() {
  const [mentorships, setMentorships] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [programForm, setProgramForm] = useState(emptyProgramForm);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const mentorshipData = await fetchMentorships();
      const requestData = await fetchMentorRequests();
      const myRequestData = await fetchMyMentorshipRequests();

      setMentorships(Array.isArray(mentorshipData) ? mentorshipData : []);
      setRequests(Array.isArray(requestData) ? requestData : []);
      setMyRequests(Array.isArray(myRequestData) ? myRequestData : []);
    } catch (error) {
      console.error("Failed to load mentorship data:", error);
      setMentorships([]);
      setRequests([]);
      setMyRequests([]);
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

    const result = editingId
      ? await updateMentorship(editingId, programForm)
      : await createMentorship(programForm);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage(
      editingId
        ? "Mentorship program updated successfully."
        : "Mentorship program created successfully."
    );

    setProgramForm(emptyProgramForm);
    setEditingId(null);
    await loadData();
  }

  async function submitRequest(event) {
    event.preventDefault();
    setMessage("");

    const result = await createMentorRequest({
      programID: requestForm.programID,
      roleType: requestForm.roleType,
      membershipStatus: "Pending",
    });

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Mentorship request submitted successfully.");
    setRequestForm(emptyRequestForm);
    await loadData();
  }

  function handleEditProgram(item) {
    setEditingId(item.id);
    setProgramForm({
      name: item.name || "",
      focusArea: item.focusArea || "",
      description: item.description || "",
      privacyType: item.privacyType || "Public",
      isActive: item.isActive ?? true,
    });
    setMessage(`Editing mentorship program: ${item.name}`);
  }

  async function handleDeactivateProgram(id) {
    const result = await deactivateMentorship(id);
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Mentorship program deactivated successfully.");
    await loadData();
  }

  async function handleDeleteProgram(id) {
    const result = await deleteMentorship(id);
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Mentorship program deleted successfully.");
    await loadData();
  }

  async function handleUpdateRequest(programId, userId, roleType, membershipStatus) {
    const result = await updateMentorRequest({
      programID: programId,
      userID: userId,
      roleType,
      membershipStatus,
    });

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Mentorship request updated successfully.");
    await loadData();
  }

  async function handleDeleteRequest(programId, userId) {
    const result = await deleteMentorRequest({
      programID: programId,
      userID: userId,
    });

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Mentorship request removed successfully.");
    await loadData();
  }

  function handleClearEdit() {
    setEditingId(null);
    setProgramForm(emptyProgramForm);
    setMessage("");
  }

  return (
    <div className="mentorship-page">
      <div className="mentorship-header">
        <h1>Mentorship Program</h1>
        <p>Create, manage, and join mentorship programs.</p>
      </div>

      <section className="mentorship-section">
        <div className="mentorship-split">
          <div className="mentorship-panel">
            <h2>{editingId ? "Edit Mentorship Program" : "Create Mentorship Program"}</h2>

            <CreateMentorship
              formData={programForm}
              onChange={handleProgramChange}
              onSubmit={submitProgram}
              isEditing={!!editingId}
            />

            {editingId && (
              <button type="button" onClick={handleClearEdit} className="refresh-button">
                Cancel Edit
              </button>
            )}
          </div>

          <div className="mentorship-panel">
            <h2>Request a Mentor</h2>

            <RequestMentor
              formData={requestForm}
              onChange={handleRequestChange}
              onSubmit={submitRequest}
              mentorships={mentorships.filter((item) => !canManage(item))}
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
                  <span className="mentorship-badge">{item.privacyType}</span>
                </div>

                <p><strong>Focus Area:</strong> {item.focusArea}</p>
                <p><strong>Active:</strong> {item.isActive ? "Yes" : "No"}</p>

                <p className="mentorship-description">
                  {item.description || "No description provided."}
                </p>

                {canManage(item) && (
                  <div className="event-action-row">
                    <button type="button" onClick={() => handleEditProgram(item)}>Edit</button>
                    <button type="button" onClick={() => handleDeactivateProgram(item.id)}>Deactivate</button>
                    <button type="button" onClick={() => handleDeleteProgram(item.id)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mentorship-section">
        <h2>Mentorship Requests For Your Programs</h2>

        {requests.length === 0 ? (
          <p className="empty-state">No mentorship requests submitted yet.</p>
        ) : (
          <div className="mentorship-card-grid">
            {requests.map((item, index) => (
              <div className="mentorship-card" key={`${item.programId}-${item.userId}-${index}`}>
                <div className="mentorship-card-top">
                  <h3>{item.userName || `User ${item.userId}`}</h3>
                  <span className="mentorship-badge">{item.membershipStatus}</span>
                </div>

                <p><strong>Program:</strong> {item.programName || `Program ${item.programId}`}</p>
                <p><strong>Role Type:</strong> {item.roleType}</p>
                <p><strong>Joined At:</strong> {item.joinedAt || "Not joined yet"}</p>

                <div className="event-action-row">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateRequest(item.programId, item.userId, item.roleType, "Accepted")
                    }
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateRequest(item.programId, item.userId, item.roleType, "Declined")
                    }
                  >
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(item.programId, item.userId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mentorship-section">
        <h2>My Mentorship Requests</h2>

        {myRequests.length === 0 ? (
          <p className="empty-state">You have not requested any mentorship programs yet.</p>
        ) : (
          <div className="mentorship-card-grid">
            {myRequests.map((item, index) => (
              <div className="mentorship-card" key={`${item.programId}-${index}`}>
                <div className="mentorship-card-top">
                  <h3>{item.programName}</h3>
                  <span className="mentorship-badge">{item.membershipStatus}</span>
                </div>

                <p><strong>Requested Role:</strong> {item.roleType}</p>
                <p><strong>Requested At:</strong> {item.joinedAt || "N/A"}</p>

                {item.membershipStatus === "Accepted" && (
                  <>
                    <p><strong>Program Contact:</strong> {item.creatorName}</p>
                    <p><strong>Email:</strong> {item.creatorEmail}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
