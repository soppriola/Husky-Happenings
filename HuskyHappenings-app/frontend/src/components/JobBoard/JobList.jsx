import React, { useState } from "react";
import ApplyToJobForm from "./ApplyToJobForm";

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

export default function JobList({
  jobs,
  onEdit,
  onClose,
  onDelete,
  onApply,
  onUpdateApplicationStatus,
}) {
  const [activeApplyJobId, setActiveApplyJobId] = useState(null);

  if (!jobs || jobs.length === 0) {
    return <p className="empty-state">No jobs posted yet.</p>;
  }

  function handleOpenApply(jobId) {
    setActiveApplyJobId(jobId);
  }

  function handleCloseApply() {
    setActiveApplyJobId(null);
  }

  async function handleSubmitApplication(jobId, coverLetter, resumeURL) {
    await onApply(jobId, coverLetter, resumeURL);
    setActiveApplyJobId(null);
  }

  return (
    <div className="job-card-grid">
      {jobs.map((job) => (
        <div className="job-card" key={job.id}>
          <div className="job-card-top">
            <div>
              <h3>{job.title}</h3>
              <p className="job-company">{job.company}</p>
            </div>
            <span className="job-badge">{job.status}</span>
          </div>

          <p className="job-description">
            {job.description || "No description provided."}
          </p>

          <div className="job-meta">
            <p><strong>Location:</strong> {job.location}</p>
            <p><strong>Method:</strong> {job.applicationMethod}</p>
            {job.contactEmail && <p><strong>Email:</strong> {job.contactEmail}</p>}
            {job.applicationURL && <p><strong>Link:</strong> {job.applicationURL}</p>}
            <p><strong>Deadline:</strong> {formatDateTime(job.deadline)}</p>
          </div>

          <div className="job-action-row">
            <button type="button" onClick={() => onEdit(job)}>
              Edit
            </button>
            <button type="button" onClick={() => onClose(job.id)}>
              Close
            </button>
            <button type="button" onClick={() => onDelete(job.id)}>
              Delete
            </button>
          </div>

          <div className="job-action-row">
            <button
              type="button"
              onClick={() => handleOpenApply(job.id)}
            >
              Apply
            </button>

            <button
              type="button"
              onClick={() => {
                const applicationId = window.prompt("Enter JobApplicationID to mark Under Review:");
                if (applicationId) {
                  onUpdateApplicationStatus(applicationId, "Under Review");
                }
              }}
            >
              Mark Under Review
            </button>
          </div>

          {activeApplyJobId === job.id && (
            <ApplyToJobForm
              jobId={job.id}
              onSubmit={handleSubmitApplication}
              onCancel={handleCloseApply}
            />
          )}
        </div>
      ))}
    </div>
  );
}
