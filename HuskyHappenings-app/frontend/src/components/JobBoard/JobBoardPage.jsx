import React, { useEffect, useState } from "react";
import { fetchJobs, createJob } from "../../api";
import CreateJobForm from "./CreateJobForm";
import JobList from "./JobList";

export default function JobBoardPage() {
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    applicationMethod: "Email",
    contactEmail: "",
    applicationURL: "",
    deadline: "",
  });

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

    const result = await createJob(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Job posted successfully.");
    setFormData({
      title: "",
      company: "",
      location: "",
      description: "",
      applicationMethod: "Email",
      contactEmail: "",
      applicationURL: "",
      deadline: "",
    });

    loadJobs();
  }

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1>Job Board</h1>
        <p>Post and view jobs or internships.</p>
      </div>

      <section className="jobs-section">
        <h2>Create Job Posting</h2>
        <CreateJobForm
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
        {message && <p className="jobs-message">{message}</p>}
      </section>

      <section className="jobs-section">
        <div className="jobs-list-header">
          <h2>Available Jobs</h2>
          <button type="button" onClick={loadJobs} className="refresh-button">
            Refresh
          </button>
        </div>
        <JobList jobs={jobs} />
      </section>
    </div>
  );
}
