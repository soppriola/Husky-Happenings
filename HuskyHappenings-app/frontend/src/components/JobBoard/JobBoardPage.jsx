import React, { useEffect, useState } from "react";
import {
  fetchJobs,
  fetchMyJobApplications,
  createJob,
  updateJob,
  closeJob,
  deleteJob,
  applyToJob,
  updateJobApplicationStatus,
  deleteJobApplication,
} from "../../api";
import CreateJobForm from "./CreateJobForm";
import JobList from "./JobList";

const emptyForm = {
  title: "",
  company: "",
  location: "",
  description: "",
  applicationMethod: "Email",
  contactEmail: "",
  applicationURL: "",
  deadline: "",
  status: "Active",
};

function toDateTimeLocal(value) {
  if (!value) return "";

  const raw = String(value).replace("T", " ");
  const [datePart, timePartRaw] = raw.split(" ");

  if (!datePart || !timePartRaw) return "";

  const [hour, minute] = timePartRaw.split(":");
  return `${datePart}T${hour}:${minute}`;
}

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

export default function JobBoardPage() {
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadJobs();
    loadMyApplications();
  }, []);

  async function loadJobs() {
    const data = await fetchJobs();
    if (Array.isArray(data)) {
      setJobs(data);
    } else {
      setJobs([]);
    }
  }

  async function loadMyApplications() {
    const data = await fetchMyJobApplications();
    if (Array.isArray(data)) {
      setMyApplications(data);
    } else {
      setMyApplications([]);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      applicationMethod: "Email",
      applicationURL: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const payload = {
      ...formData,
      applicationMethod: "Email",
      applicationURL: "",
    };

    const result = editingId
      ? await updateJob(editingId, payload)
      : await createJob(payload);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage(editingId ? "Job updated successfully." : "Job posted successfully.");
    setFormData(emptyForm);
    setEditingId(null);
    await loadJobs();
  }

  function handleEdit(job) {
    setEditingId(job.id);
    setFormData({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      description: job.description || "",
      applicationMethod: "Email",
      contactEmail: job.contactEmail || "",
      applicationURL: "",
      deadline: toDateTimeLocal(job.deadline),
      status: job.status || "Active",
    });
    setMessage(`Editing job: ${job.title}`);
  }

  async function handleCloseJob(id) {
    const result = await closeJob(id);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Job closed successfully.");
    await loadJobs();
  }

  async function handleDeleteJob(id) {
    const result = await deleteJob(id);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Job deleted successfully.");
    await loadJobs();
  }

  async function handleApply(id, coverLetter, resumeURL) {
    const result = await applyToJob(id, coverLetter, resumeURL);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Applied to job successfully.");
    await loadJobs();
    await loadMyApplications();
  }

  async function handleUpdateApplicationStatus(applicationId, status) {
    const result = await updateJobApplicationStatus(applicationId, status);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Job application status updated successfully.");
    await loadJobs();
    await loadMyApplications();
  }

  async function handleDeleteApplication(applicationId) {
  const result = await deleteJobApplication(applicationId);

  if (result.error) {
    setMessage(result.error);
    return;
  }

  setMessage("Application deleted successfully.");
  await loadJobs();
  await loadMyApplications();
}

  function handleClearEdit() {
    setEditingId(null);
    setFormData(emptyForm);
    setMessage("");
  }

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1>Job Board</h1>
        <p>Post, update, and manage jobs or internships.</p>
      </div>

      <section className="jobs-section">
        <h2>{editingId ? "Edit Job Posting" : "Create Job Posting"}</h2>
        <CreateJobForm
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
        {editingId && (
          <button type="button" onClick={handleClearEdit} className="refresh-button">
            Cancel Edit
          </button>
        )}
        {message && <p className="jobs-message">{message}</p>}
      </section>

      <section className="jobs-section">
        <div className="jobs-list-header">
          <h2>Recent Applications</h2>
        </div>

        {!myApplications || myApplications.length === 0 ? (
          <p className="empty-state">You have not applied to any jobs yet.</p>
        ) : (
          <div className="job-card-grid">
            {myApplications.map((application) => (
              <div className="job-card" key={application.applicationId}>
                <h3>{application.jobTitle}</h3>
                <p className="job-company">{application.company}</p>
                <p><strong>Status:</strong> {application.applicationStatus}</p>
                <p><strong>Applied:</strong> {formatDateTime(application.appliedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="jobs-section">
        <div className="jobs-list-header">
          <h2>Available Jobs</h2>
          <button type="button" onClick={loadJobs} className="refresh-button">
            Refresh
          </button>
        </div>
        <JobList
          jobs={jobs}
          onEdit={handleEdit}
          onClose={handleCloseJob}
          onDelete={handleDeleteJob}
          onApply={handleApply}
          onUpdateApplicationStatus={handleUpdateApplicationStatus}
          onDeleteApplication={handleDeleteApplication}
        />
      </section>
    </div>
  );
}
