import React from "react";

export default function RequestMentor({ formData, onChange, onSubmit }) {
  return (
    <form className="mentorship-form-grid" onSubmit={onSubmit}>
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
        placeholder="What are you hoping to get help with?"
        value={formData.goal}
        onChange={onChange}
        rows="4"
      />

      <button type="submit" className="primary-button">
        Submit Request
      </button>
    </form>
  );
}
