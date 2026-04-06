import React, { useEffect, useState } from "react";
import { fetchEvents, createEvent } from "../../api";
import CreateEventForm from "./CreateEventForm";
import EventList from "./EventList";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startDateTime: "",
    endDateTime: "",
    privacyType: "Public",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const data = await fetchEvents();
    setEvents(data);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await createEvent(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Event created successfully.");
    setFormData({
      title: "",
      description: "",
      location: "",
      startDateTime: "",
      endDateTime: "",
      privacyType: "Public",
    });
    loadEvents();
  }

  return (
    <div>
      <h2>Events</h2>
      <p>Create and view upcoming events.</p>

      <CreateEventForm
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      {message && <p className="message">{message}</p>}

      <EventList events={events} />
    </div>
  );
}
