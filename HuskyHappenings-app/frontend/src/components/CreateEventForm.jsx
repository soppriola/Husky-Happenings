import React from "react";

export default function CreateEventForm({ formData, onChange, onSubmit }) {
  return (
    <form className="feature-form" onSubmit={onSubmit}>
      <input
        name="title"
        placeholder="Event title"
        value={formData.title}
        onChange={onChange}
      />
      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={onChange}
      />
      <input
        name="location"
        placeholder="Location"
        value={formData.location}
        onChange={onChange}
      />
      <label>Start Date/Time</label>
      <input
        type="datetime-local"
        name="startDateTime"
        value={formData.startDateTime}
        onChange={onChange}
      />
      <label>End Date/Time</label>
      <input
        type="datetime-local"
        name="endDateTime"
        value={formData.endDateTime}
        onChange={onChange}
      />
      <select name="privacyType" value={formData.privacyType} onChange={onChange}>
        <option value="Public">Public</option>
        <option value="Private">Private</option>
      </select>
      <button type="submit">Create Event</button>
    </form>
  );
}
