import React from "react";

function formatDateTime(value) {
  if (!value) return "N/A";

  const raw = String(value).replace("T", " ");
  const [datePart, timePartRaw] = raw.split(" ");

  if (!datePart || !timePartRaw) return value;

  const [year, month, day] = datePart.split("-");
  const [hourStr, minuteStr] = timePartRaw.split(":");

  let hour = Number(hourStr);
  const minute = minuteStr ?? "00";

  if (Number.isNaN(hour)) return value;

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${month}/${day}/${year}, ${hour}:${minute} ${ampm}`;
}

export default function EventList({
  events,
  currentUserId,
  onEdit,
  onCancel,
  onDelete,
  onRegister,
  onUpdateRSVP,
}) {
  if (!events || events.length === 0) {
    return <p className="empty-state">No events yet. Create one to get started.</p>;
  }

  return (
    <div className="event-card-grid">
      {events.map((event) => (
        <div className="event-card" key={event.id}>
          <div className="event-card-top">
            <h3>{event.title}</h3>
            <span className="event-badge">{event.privacyType}</span>
          </div>

          <p className="event-description">
            {event.description || "No description provided."}
          </p>

          <div className="event-meta">
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Starts:</strong> {formatDateTime(event.startDateTime)}</p>
            <p><strong>Ends:</strong> {formatDateTime(event.endDateTime)}</p>
            <p><strong>Status:</strong> {event.status}</p>
            {event.cancellationReason && (
              <p><strong>Reason:</strong> {event.cancellationReason}</p>
            )}
          </div>

          {String(event.createdBy) === String(currentUserId) && (
          <div className="event-action-row">
              <button type="button" onClick={() => onEdit(event)}>Edit</button>
              <button type="button" onClick={() => onCancel(event.id)}>Cancel</button>
              <button type="button" onClick={() => onDelete(event.id)}>Delete</button>
          </div>
)}

          <div className="event-action-row">
            <button type="button" onClick={() => onRegister(event.id, "Going")}>
              Register Going
            </button>
            <button type="button" onClick={() => onUpdateRSVP(event.id, "Interested")}>
              Mark Interested
            </button>
            <button type="button" onClick={() => onUpdateRSVP(event.id, "Not Going")}>
              Mark Not Going
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
