import React from "react";

export default function JobList({ jobs }) {
  return (
    <div className="card-grid">
      {jobs.map((job) => (
        <div className="feature-card" key={job.id}>
          <h3>{job.title}</h3>
          <p><strong>Company:</strong> {job.company}</p>
          <p><strong>Location:</strong> {job.location}</p>
          <p><strong>Description:</strong> {job.description}</p>
          <p><strong>Method:</strong> {job.applicationMethod}</p>
          {job.contactEmail && <p><strong>Email:</strong> {job.contactEmail}</p>}
          {job.applicationURL && <p><strong>Link:</strong> {job.applicationURL}</p>}
          <p><strong>Deadline:</strong> {job.deadline}</p>
          <p><strong>Status:</strong> {job.status}</p>
        </div>
      ))}
    </div>
  );
}
