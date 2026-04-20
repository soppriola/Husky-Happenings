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
  groupID: "",
  roleType: "Member",
  membershipStatus: "Pending",
};

export default function MentorshipPage() {
  const [mentorships, setMentorships] = useState([]);
  const [requests, setRequests] = useState([]);
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

    let result;
    if (editingId) {
      result = await updateMentorship(editingId, programForm);
    } else {
      result = await createMentorship(programForm);
    }

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
    setRequestForm(emptyRequestForm);
    loadData();
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
    loadData();
  }

  async function handleDeleteProgram(id) {
    const result = await deleteMentorship(id);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Mentorship program deleted successfully.");
    loadData();
  }

  async function handleUpdateRequest(groupId, userId, roleType, membershipStatus) {
    const result = await updateMentorRequest({
      groupID: groupId,
      userID: userId,
      roleType,
      membershipStatus,
    });

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Mentorship request updated successfully.");
    loadData();
  }

  async function handleDeleteRequest(groupId, userId) {
    const result = await deleteMentorRequest({
      groupID: groupId,
      userID: userId,
    });

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Mentorship request removed successfully.");
    loadData();
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
            <h2>
              {editingId ? "Edit Mentorship Program" : "Create Mentorship Program"}
            </h2>
            <CreateMentorship
              formData={programForm}
              onChange={handleProgramChange}
              onSubmit={submitProgram}
              isEditing={!!editingId}
            />
            {editingId && (
              <button
                type="button"
                onClick={handleClearEdit}
                className="refresh-button"
              >
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
              mentorships={mentorships}
            />
          </div>
        </div>

        {message && <p className="mentorship-message">{message}</p>}
      </section>

      <section className="mentorship-section">
        <div className="mentorship-list-header">
          <h2>Available Mentorship Programs</h2>
          <button
            type="button"
            onClick={loadData}
            className="refresh-button"
          >
            Refresh
          </button>
        </div>

        {mentorships.length === 0 ? (
          <p className="empty-state">
            No mentorship programs available yet.
          </p>
        ) : (
          <div className="mentorship-card-grid">
            {mentorships.map((item) => (
              <div className="mentorship-card" key={item.id}>
                <div className="mentorship-card-top">
                  <h3>{item.name}</h3>
                  <span className="mentorship-badge">
                    {item.privacyType}
                  </span>
                </div>
                <p>
                  <strong>Focus Area:</strong> {item.focusArea}
                </p>
                <p>
                  <strong>Active:</strong>{" "}
                  {item.isActive ? "Yes" : "No"}
                </p>
                <p className="mentorship-description">
                  {item.description || "No description provided."}
                </p>

                <div className="event-action-row">
                  <button
                    type="button"
                    onClick={() => handleEditProgram(item)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeactivateProgram(item.id)}
                  >
                    Deactivate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProgram(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mentorship-section">
        <h2>Mentorship Requests</h2>

        {requests.length === 0 ? (
          <p className="empty-state">
            No mentorship requests submitted yet.
          </p>
        ) : (
          <div className="mentorship-card-grid">
            {requests.map((item, index) => (
              <div
                className="mentorship-card"
                key={`${item.groupId}-${item.userId}-${index}`}
              >
                <div className="mentorship-card-top">
                  <h3>{item.userName || `User ${item.userId}`}</h3>
                  <span className="mentorship-badge">
                    {item.membershipStatus}
                  </span>
                </div>

                <p>
                  <strong>Program:</strong>{" "}
                  {item.groupName || `Group ${item.groupId}`}
                </p>

                <p>
                  <strong>Role Type:</strong> {item.roleType}
                </p>

                <p>
                  <strong>Joined At:</strong>{" "}
                  {item.joinedAt || "Not joined yet"}
                </p>

                <div className="event-action-row">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateRequest(
                        item.groupId,
                        item.userId,
                        item.roleType,
                        "Accepted"
                      )
                    }
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateRequest(
                        item.groupId,
                        item.userId,
                        item.roleType,
                        "Declined"
                      )
                    }
                  >
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteRequest(item.groupId, item.userId)
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
