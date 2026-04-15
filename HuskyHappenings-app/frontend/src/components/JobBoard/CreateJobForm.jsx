import React from "react";

export default function CreateJobForm({ formData, onChange, onSubmit }) {
  return (
    <form className="feature-form" onSubmit={onSubmit}>
      <input
        name="title"
        placeholder="Job title"
        value={formData.title}
        onChange={onChange}
      />
      <input
        name="company"
        placeholder="Company"
        value={formData.company}
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
      />

      <select
        name="applicationMethod"
        value={formData.applicationMethod}
        onChange={onChange}
      >
        <option value="Email">Email</option>
        <option value="External Link">External Link</option>
        <option value="Platform">Platform</option>
      </select>

      {formData.applicationMethod === "Email" && (
        <input
          name="contactEmail"
          placeholder="Contact email"
          value={formData.contactEmail}
          onChange={onChange}
        />
      )}

      {formData.applicationMethod === "External Link" && (
        <input
          name="applicationURL"
          placeholder="Application URL"
          value={formData.applicationURL}
          onChange={onChange}
        />
      )}

      <label>Deadline</label>
      <input
        type="datetime-local"
        name="deadline"
        value={formData.deadline}
        onChange={onChange}
      />

      <button type="submit">Post Job</button>
    </form>
  );
}
