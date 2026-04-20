import React, { useEffect, useState } from "react";
import {
  fetchJobs,
  createJob,
  updateJob,
  closeJob,
  deleteJob,
  applyToJob,
  updateJobApplicationStatus,
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

export default function JobBoardPage() {
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    const data = await fetchJobs();
    if (Array.isArray(data)) {
      setJobs(data);
    } else {
      setJobs([]);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    let result;
    if (editingId) {
      result = await updateJob(editingId, formData);
    } else {
      result = await createJob(formData);
    }

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage(editingId ? "Job updated successfully." : "Job posted successfully.");
    setFormData(emptyForm);
    setEditingId(null);
    loadJobs();
  }

  function handleEdit(job) {
    setEditingId(job.id);
    setFormData({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      description: job.description || "",
      applicationMethod: job.applicationMethod || "Email",
      contactEmail: job.contactEmail || "",
      applicationURL: job.applicationURL || "",
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
    loadJobs();
  }

  async function handleDeleteJob(id) {
    const result = await deleteJob(id);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Job deleted successfully.");
    loadJobs();
  }

  async function handleApply(id, coverLetter, resumeURL) {
    const result = await applyToJob(id, coverLetter, resumeURL);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Applied to job successfully.");
  }

  async function handleUpdateApplicationStatus(applicationId, status) {
    const result = await updateJobApplicationStatus(applicationId, status);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Job application status updated successfully.");
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
        />
      </section>
    </div>
  );
}
