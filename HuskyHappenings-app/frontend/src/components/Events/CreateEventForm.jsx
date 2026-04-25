import React from "react";

export default function CreateEventForm({ formData, onChange, onSubmit, groups = [] }) {
  return (
    <form className="event-form-grid" onSubmit={onSubmit}>
      <input
        name="title"
        placeholder="Event title"
        value={formData.title}
        onChange={onChange}
      />

      <input
        name="location"
        placeholder="Location"
        value={formData.location}
        onChange={onChange}
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={onChange}
        rows="4"
      />

      <div className="event-form-row">
        <div>
          <label>Start Date/Time</label>
          <input
            type="datetime-local"
            name="startDateTime"
            value={formData.startDateTime}
            min={new Date().toISOString().slice(0, 16)}
            onChange={onChange}
          />
        </div>

        <div>
          <label>End Date/Time</label>
          <input
            type="datetime-local"
            name="endDateTime"
            value={formData.endDateTime}
            min={new Date().toISOString().slice(0, 16)}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="event-form-row">
        <div>
          <label>Privacy</label>
          <select
            name="privacyType"
            value={formData.privacyType}
            onChange={onChange}
          >
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>

          {formData.privacyType === "Private" && (
            <>
              <label>Group Access</label>
              <select
                name="groupID"
                value={formData.groupID || ""}
                onChange={onChange}
              >
                <option value="">Select a Group</option>
                {groups.map((g) => (
                  <option key={g.GroupID} value={g.GroupID}>
                    {g.GroupName}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="event-button-wrap">
          <button type="submit" className="primary-button">
            Create Event
          </button>
        </div>
      </div>
    </form>
  );
}
