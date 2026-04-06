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
    setJobs(data);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
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
    <div>
      <h2>Job Board</h2>
      <p>Post and view jobs or internships.</p>

      <CreateJobForm
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      {message && <p className="message">{message}</p>}

      <JobList jobs={jobs} />
    </div>
  );
}
