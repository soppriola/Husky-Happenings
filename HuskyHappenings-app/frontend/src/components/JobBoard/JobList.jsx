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

function canManage(job) {
  return job.canManage === 1 || job.canManage === true || job.canManage === "1";
}

function isClosed(job) {
  return String(job.status).toLowerCase() === "closed";
}

export default function JobList({
  jobs,
  onEdit,
  onClose,
  onDelete,
  onApply,
  onUpdateApplicationStatus,
  onDeleteApplication,
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
      {jobs.map((job) => {
        const closed = isClosed(job);

        return (
          <div className={`job-card ${closed ? "closed-job-card" : ""}`} key={job.id}>
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
              <p><strong>Method:</strong> Email</p>
              {job.contactEmail && <p><strong>Email:</strong> {job.contactEmail}</p>}
              <p><strong>Deadline:</strong> {formatDateTime(job.deadline)}</p>
            </div>

            {canManage(job) && (
              <div className="job-action-row">
                <button type="button" onClick={() => onEdit(job)}>
                  Edit
                </button>

                {!closed && (
                  <button type="button" onClick={() => onClose(job.id)}>
                    Close
                  </button>
                )}

                <button type="button" onClick={() => onDelete(job.id)}>
                  Delete
                </button>
              </div>
            )}

            {!canManage(job) && !closed && (
              <div className="job-action-row">
                <button type="button" onClick={() => handleOpenApply(job.id)}>
                  Apply
                </button>
              </div>
            )}

            {!canManage(job) && closed && (
              <p className="empty-state">
                This position is closed and no longer accepting applications.
              </p>
            )}

            {activeApplyJobId === job.id && !closed && (
              <ApplyToJobForm
                jobId={job.id}
                onSubmit={handleSubmitApplication}
                onCancel={handleCloseApply}
              />
            )}

            {canManage(job) && (
              <div className="job-applications-box">
                <h4>Applications for this job</h4>

                {!job.applications || job.applications.length === 0 ? (
                  <p className="empty-state">No applications yet.</p>
                ) : (
                  job.applications.map((application) => (
                    <div className="job-application-card" key={application.applicationId}>
                      <p><strong>Applicant:</strong> {application.applicantName}</p>
                      <p><strong>Email:</strong> {application.applicantEmail}</p>
                      <p><strong>Status:</strong> {application.applicationStatus}</p>
                      <p><strong>Applied:</strong> {formatDateTime(application.appliedAt)}</p>
                      <p><strong>Cover Letter:</strong> {application.coverLetter || "N/A"}</p>

                      {application.resumeURL && (
                        <p><strong>Resume:</strong> {application.resumeURL}</p>
                      )}

                      <div className="job-action-row">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateApplicationStatus(application.applicationId, "Under Review")
                          }
                        >
                          Mark Under Review
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateApplicationStatus(application.applicationId, "Accepted")
                          }
                        >
                          Accept
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateApplicationStatus(application.applicationId, "Rejected")
                          }
                        >
                          Decline
                        </button>

                        {(application.applicationStatus === "Rejected" ||
                          application.applicationStatus === "Declined") && (
                          <button
                            type="button"
                            onClick={() => onDeleteApplication(application.applicationId)}
                          >
                            Delete Application
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
