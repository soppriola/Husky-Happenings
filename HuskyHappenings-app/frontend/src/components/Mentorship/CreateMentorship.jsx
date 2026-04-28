// Author: Arianna Kelsey

import React from "react";

export default function CreateMentorship({
  formData,
  onChange,
  onSubmit,
  isEditing,
}) {
  return (
    <form className="mentorship-form-grid" onSubmit={onSubmit}>
      
      <input
        name="name"
        placeholder="Program name"
        value={formData.name}
        onChange={onChange}
      />

      <input
        name="focusArea"
        placeholder="Focus area / study category"
        value={formData.focusArea}
        onChange={onChange}
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={onChange}
        rows="4"
      />

      <div>
        <label>Privacy Type</label>

        <select
          name="privacyType"
          value={formData.privacyType}
          onChange={onChange}
        >
          <option value="Public">Public</option>
          <option value="Private">
            Private (Only visible to group members)
          </option>
        </select>
      </div>

      <button type="submit" className="primary-button">
        {isEditing ? "Update Program" : "Create Program"}
      </button>
    </form>
  );
}
