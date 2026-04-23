import { useEffect, useState } from "react";
import "./Groups.css";

export default function Groups() {
  const [myGroups, setMyGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [studyCategory, setStudyCategory] = useState("");
  const [privacyType, setPrivacyType] = useState("Public");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadMyGroups = async () => {
    try {
      const response = await fetch("https://localhost:5000/api/groups/my", {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setMyGroups(data);
      } else {
        setError(data.error || "Failed to load your groups");
      }
    } catch (err) {
      setError("Network error loading your groups");
    }
  };

  useEffect(() => {
    loadMyGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!groupName.trim() || !description.trim() || !studyCategory.trim()) {
      setError("Please fill out all fields");
      return;
    }

    try {
      const response = await fetch("https://localhost:5000/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          groupName,
          description,
          studyCategory,
          privacyType,
        }),
      });

      const text = await response.text();
      let data = {};

      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (response.ok) {
        setMessage("Group created successfully");
        setGroupName("");
        setDescription("");
        setStudyCategory("");
        setPrivacyType("Public");
        loadMyGroups();
        setSearchResults([]);
        setSearchTerm("");
      } else {
        setError(data.error || "Failed to create group");
      }
    } catch (err) {
      setError("Network error creating group");
    }
  };

  const handleSearchGroups = async () => {
    setError("");
    setMessage("");

    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://localhost:5000/api/groups/search?q=${encodeURIComponent(searchTerm)}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSearchResults(data);
      } else {
        setError(data.error || "Failed to search groups");
      }
    } catch (err) {
      setError("Network error searching groups");
    }
  };

  const handleJoinGroup = async (groupId) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`https://localhost:5000/api/groups/${groupId}/join`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        loadMyGroups();
        handleSearchGroups();
      } else {
        setError(data.error || "Failed to join group");
      }
    } catch (err) {
      setError("Network error joining group");
    }
  };

  return (
    <div className="groups-page">
      <h2>Groups</h2>

      {error && <p className="groups-error">{error}</p>}
      {message && <p className="groups-message">{message}</p>}

      <section className="groups-section">
        <h3>Create a Group</h3>
        <form className="group-form" onSubmit={handleCreateGroup}>
          <input
            type="text"
            placeholder="Group title"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Study category"
            value={studyCategory}
            onChange={(e) => setStudyCategory(e.target.value)}
          />

          <textarea
            placeholder="Group description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
          />

          <select
            value={privacyType}
            onChange={(e) => setPrivacyType(e.target.value)}
          >
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>

          <button type="submit">Create Group</button>
        </form>
      </section>

      <section className="groups-section">
        <h3>My Groups</h3>
        {myGroups.length === 0 ? (
          <p>You are not in any groups yet.</p>
        ) : (
          <div className="groups-list">
            {myGroups.map((group) => (
              <div key={group.GroupID} className="group-card">
                <h4>{group.GroupName}</h4>
                <p><strong>Category:</strong> {group.StudyCategory}</p>
                <p><strong>Privacy:</strong> {group.PrivacyType}</p>
                <p><strong>Role:</strong> {group.RoleType}</p>
                <p>{group.Description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="groups-section">
        <h3>Search Groups</h3>

        <div className="group-search-bar">
          <input
            type="text"
            placeholder="Search groups by title or category"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearchGroups}>Search</button>
        </div>

        {searchResults.length > 0 && (
          <div className="groups-list">
            {searchResults.map((group) => (
              <div key={group.GroupID} className="group-card">
                <h4>{group.GroupName}</h4>
                <p><strong>Category:</strong> {group.StudyCategory}</p>
                <p><strong>Privacy:</strong> {group.PrivacyType}</p>
                <p>{group.Description}</p>

                {group.CurrentUserStatus === "Accepted" ? (
                  <button disabled>Joined</button>
                ) : group.CurrentUserStatus === "Pending" ? (
                  <button disabled>Request Pending</button>
                ) : (
                  <button onClick={() => handleJoinGroup(group.GroupID)}>
                    {group.PrivacyType === "Private" ? "Request to Join" : "Join Group"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {searchTerm.trim() && searchResults.length === 0 && (
          <p>No matching groups found.</p>
        )}
      </section>
    </div>
  );
}