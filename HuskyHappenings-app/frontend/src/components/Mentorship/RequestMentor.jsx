import React from "react";

export default function RequestMentor({ formData, onChange, onSubmit }) {
  return (
    <form className="feature-form" onSubmit={onSubmit}>
      <input
        name="studentName"
        placeholder="Student name"
        value={formData.studentName}
        onChange={onChange}
      />
      <input
        name="interestArea"
        placeholder="Interest area"
        value={formData.interestArea}
        onChange={onChange}
      />
      <textarea
        name="goal"
        placeholder="Goal"
        value={formData.goal}
        onChange={onChange}
      />
      <button type="submit">Submit Request</button>
    </form>
  );
}
