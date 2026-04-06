import React from "react";

export default function EventList({ events }) {
  return (
    <div className="card-grid">
      {events.map((event) => (
        <div className="feature-card" key={event.id}>
          <h3>{event.title}</h3>
          <p><strong>Description:</strong> {event.description}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Start:</strong> {event.startDateTime}</p>
          <p><strong>End:</strong> {event.endDateTime}</p>
          <p><strong>Privacy:</strong> {event.privacyType}</p>
          <p><strong>Status:</strong> {event.status}</p>
        </div>
      ))}
    </div>
  );
}
