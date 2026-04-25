import React from "react";

export default function CreateJobForm({ formData, onChange, onSubmit }) {
  return (
    <form className="job-form-grid" onSubmit={onSubmit}>
      <div className="job-form-row">
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
      </div>

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

      <div className="job-form-row">
        <div>
          <label>Application Method</label>
          <input value="Email" disabled />
        </div>

        <div>
          <label>Deadline</label>
          <input
            type="datetime-local"
            name="deadline"
            value={formData.deadline}
            onChange={onChange}
          />
        </div>
      </div>

      <input
        name="contactEmail"
        placeholder="Contact email"
        value={formData.contactEmail}
        onChange={onChange}
      />

      <div className="job-button-wrap">
        <button type="submit" className="primary-button">
          Post Job
        </button>
      </div>
    </form>
  );
}
