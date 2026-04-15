import React from "react";

export default function CreateMentorship({ formData, onChange, onSubmit }) {
  return (
    <form className="feature-form" onSubmit={onSubmit}>
      <input
        name="name"
        placeholder="Program name"
        value={formData.name}
        onChange={onChange}
      />
      <input
        name="mentorName"
        placeholder="Mentor name"
        value={formData.mentorName}
        onChange={onChange}
      />
      <input
        name="focusArea"
        placeholder="Focus area"
        value={formData.focusArea}
        onChange={onChange}
      />
      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={onChange}
      />
      <select name="meetingStyle" value={formData.meetingStyle} onChange={onChange}>
        <option value="Virtual">Virtual</option>
        <option value="In Person">In Person</option>
        <option value="Hybrid">Hybrid</option>
      </select>
      <button type="submit">Create Program</button>
    </form>
  );
}
