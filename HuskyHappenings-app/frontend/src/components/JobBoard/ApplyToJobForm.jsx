import React, { useState } from "react";

export default function ApplyToJobForm({ jobId, onSubmit, onCancel }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeURL, setResumeURL] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!coverLetter.trim()) {
      return;
    }

    onSubmit(jobId, coverLetter, resumeURL);
    setCoverLetter("");
    setResumeURL("");
  }

  return (
    <form className="job-apply-form" onSubmit={handleSubmit}>
      <textarea
        className="job-apply-textarea"
        placeholder="Write your cover letter..."
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        rows="4"
      />

      <input
        className="job-apply-input"
        type="text"
        placeholder="Optional resume URL..."
        value={resumeURL}
        onChange={(e) => setResumeURL(e.target.value)}
      />

      <div className="job-action-row">
        <button type="submit">Submit Application</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
