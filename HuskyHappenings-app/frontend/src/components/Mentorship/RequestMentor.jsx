import React from "react";

export default function RequestMentor({ formData, onChange, onSubmit, mentorships }) {
  return (
    <form className="mentorship-form-grid" onSubmit={onSubmit}>
      <div>
        <label>Mentorship Program</label>
        <select
          name="groupID"
          value={formData.groupID}
          onChange={onChange}
        >
          <option value="">Select a program</option>
          {mentorships.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Role Type</label>
        <select
          name="roleType"
          value={formData.roleType}
          onChange={onChange}
        >
          <option value="Member">Member</option>
          <option value="Moderator">Moderator</option>
          <option value="Owner">Owner</option>
        </select>
      </div>

      <div>
        <label>Membership Status</label>
        <select
          name="membershipStatus"
          value={formData.membershipStatus}
          onChange={onChange}
        >
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Invited">Invited</option>
          <option value="Declined">Declined</option>
        </select>
      </div>

      <button type="submit" className="primary-button">
        Submit Request
      </button>
    </form>
  );
}
