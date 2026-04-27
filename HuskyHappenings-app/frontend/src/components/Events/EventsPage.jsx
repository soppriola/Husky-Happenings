import React, { useEffect, useState } from "react";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  registerForEvent,
  updateEventRegistration,
} from "../../api";
import CreateEventForm from "./CreateEventForm";
import EventList from "./EventList";

const emptyForm = {
  title: "",
  description: "",
  location: "",
  startDateTime: "",
  endDateTime: "",
  privacyType: "Public",
  groupID: "",
};

function toDateTimeLocal(value) {
  if (!value) return "";

  const raw = String(value).replace("T", " ");
  const [datePart, timePartRaw] = raw.split(" ");

  if (!datePart || !timePartRaw) return "";

  const [hour, minute] = timePartRaw.split(":");
  return `${datePart}T${hour}:${minute}`;
}

function normalizeEvents(data) {
  if (!Array.isArray(data)) return [];

  return data.map((event) => ({
    ...event,
    createdBy:
      event.createdBy ??
      event.CreatedByUserID ??
      event.created_by ??
      event.creatorID ??
      "",
    groupID: event.groupID ?? event.GroupID ?? "",
  }));
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadCurrentUser();
    loadGroups();
    loadEvents();
  }, []);

  async function loadCurrentUser() {
    try {
      const res = await fetch("https://localhost:5000/api/me", {
        credentials: "include",
      });

      const data = await res.json();
      setCurrentUserId(data.user_id ?? data.USER_ID ?? data.id ?? null);
    } catch (err) {
      console.error("Failed to load current user:", err);
      setCurrentUserId(null);
    }
  }

  async function loadGroups() {
    try {
      const res = await fetch("https://localhost:5000/api/groups/my", {
        credentials: "include",
      });

      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load groups:", err);
      setGroups([]);
    }
  }

  async function loadEvents() {
    try {
      const data = await fetchEvents();

      if (Array.isArray(data)) {
        setEvents(normalizeEvents(data));
      } else if (Array.isArray(data?.events)) {
        setEvents(normalizeEvents(data.events));
      } else {
        console.warn("Unexpected events response:", data);
        setEvents([]);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
      setEvents([]);
      setMessage("Backend connection error.");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "privacyType" && value === "Public") {
        updated.groupID = "";
      }

      return updated;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (formData.privacyType === "Private" && !formData.groupID) {
      setMessage("Private events must be assigned to a group.");
      return;
    }

    const result = editingId
      ? await updateEvent(editingId, formData)
      : await createEvent(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage(
      editingId ? "Event updated successfully." : "Event created successfully."
    );
    setFormData(emptyForm);
    setEditingId(null);
    await loadEvents();
  }

  function handleEdit(eventItem) {
    setEditingId(eventItem.id);
    setFormData({
      title: eventItem.title || "",
      description: eventItem.description || "",
      location: eventItem.location || "",
      startDateTime: toDateTimeLocal(eventItem.startDateTime),
      endDateTime: toDateTimeLocal(eventItem.endDateTime),
      privacyType: eventItem.privacyType || "Public",
      groupID: eventItem.groupID || eventItem.GroupID || "",
    });
    setMessage(`Editing event: ${eventItem.title}`);
  }

  async function handleCancelEvent(id) {
    const result = await cancelEvent(id, "Cancelled from website");

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Event cancelled successfully.");
    await loadEvents();
  }

  async function handleDeleteEvent(id) {
    const result = await deleteEvent(id);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Event deleted successfully.");
    await loadEvents();
  }

  async function handleRegister(id, status) {
    const result = await registerForEvent(id, status);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Event registration created successfully.");
    await loadEvents();
  }

  async function handleUpdateRSVP(id, status) {
    const result = await updateEventRegistration(id, status, "Responded");

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("RSVP updated successfully.");
    await loadEvents();
  }

  function handleClearEdit() {
    setEditingId(null);
    setFormData(emptyForm);
    setMessage("");
  }

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Events</h1>
        <p>Create, update, and manage upcoming events.</p>
      </div>

      <section className="events-section">
        <h2>{editingId ? "Edit Event" : "Create Event"}</h2>

        <CreateEventForm
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          groups={groups}
        />

        {editingId && (
          <button type="button" onClick={handleClearEdit} className="refresh-button">
            Cancel Edit
          </button>
        )}

        {message && <p className="events-message">{message}</p>}
      </section>

      <section className="events-section">
        <div className="events-list-header">
          <h2>Upcoming Events</h2>
          <button type="button" onClick={loadEvents} className="refresh-button">
            Refresh
          </button>
        </div>

        <EventList
          events={events}
          currentUserId={currentUserId}
          onEdit={handleEdit}
          onCancel={handleCancelEvent}
          onDelete={handleDeleteEvent}
          onRegister={handleRegister}
          onUpdateRSVP={handleUpdateRSVP}
        />
      </section>
    </div>
  );
}