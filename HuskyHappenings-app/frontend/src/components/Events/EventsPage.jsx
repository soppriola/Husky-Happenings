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
};

function toDateTimeLocal(value) {
  if (!value) return "";

  const raw = String(value).replace("T", " ");
  const [datePart, timePartRaw] = raw.split(" ");

  if (!datePart || !timePartRaw) return "";

  const [hour, minute] = timePartRaw.split(":");
  return `${datePart}T${hour}:${minute}`;
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
  fetch("http://127.0.0.1:5000/api/me", {
    credentials: "include",
  })
    .then(res => res.json())
    .then(data => setCurrentUserId(data.user_id));
}, []);

  async function loadEvents() {
    const data = await fetchEvents();
    if (Array.isArray(data)) {
      setEvents(data);
    } else {
      setEvents([]);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    let result;
    if (editingId) {
      result = await updateEvent(editingId, formData);
    } else {
      result = await createEvent(formData);
    }

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage(editingId ? "Event updated successfully." : "Event created successfully.");
    setFormData(emptyForm);
    setEditingId(null);
    loadEvents();
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
    loadEvents();
  }

  async function handleDeleteEvent(id) {
    const result = await deleteEvent(id);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Event deleted successfully.");
    loadEvents();
  }

  async function handleRegister(id, status) {
    const result = await registerForEvent(id, status);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Event registration created successfully.");
  }

  async function handleUpdateRSVP(id, status) {
    const result = await updateEventRegistration(id, status, "Responded");
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("RSVP updated successfully.");
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
