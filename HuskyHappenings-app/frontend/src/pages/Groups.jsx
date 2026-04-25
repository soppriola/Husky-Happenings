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
        headers: { "Content-Type": "application/json" },
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
      } catch {}

      if (response.ok) {
        setMessage("Group created successfully!");
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
        `https://localhost:5000/api/groups/search?q=${encodeURIComponent(
          searchTerm
        )}`,
        { credentials: "include" }
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
      const response = await fetch(
        `http://localhost:5000/api/groups/${groupId}/join`,
        {
          method: "POST",
          credentials: "include",
        }
      );

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
    <main className="groups-page">
      <section className="groups-hero">
        <div>
          <p className="groups-eyebrow">Campus Groups</p>
          <h1>Find your people on campus</h1>
          <p>
            Create study groups, join campus communities, and connect with other
            students who share your interests.
          </p>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <section className="groups-section create-section">
        <div className="section-heading">
          <div>
            <h2>Start a new group</h2>
          </div>
        </div>

        <form className="group-form" onSubmit={handleCreateGroup}>
          <div className="group-form-row">
            <div className="form-group">
              <label className="form-label">Group Name</label>
              <input
                className="input-field"
                type="text"
                placeholder="CS Study Squad"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Study Category</label>
              <input
                className="input-field"
                type="text"
                placeholder="Computer Science"
                value={studyCategory}
                onChange={(e) => setStudyCategory(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input-field textarea-field"
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <div className="form-group privacy-select">
              <label className="form-label">Privacy</label>
              <select
                className="input-field"
                value={privacyType}
                onChange={(e) => setPrivacyType(e.target.value)}
              >
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              Create Group
            </button>
          </div>
        </form>
      </section>

      <section className="groups-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Memberships</p>
            <h2>My Groups</h2>
          </div>
        </div>

        {myGroups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">HH</div>
            <h3>No groups yet</h3>
            <p>Join or create a group to start building your campus network.</p>
          </div>
        ) : (
          <div className="groups-list">
            {myGroups.map((group) => (
              <article key={group.GroupID} className="group-card">
                <div className="group-card-header">
                  <div className="group-avatar">
                    {group.GroupName?.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="group-card-name">{group.GroupName}</h3>
                    <p className="group-card-category">
                      {group.StudyCategory}
                    </p>
                  </div>
                </div>

                <div className="group-card-meta">
                  <span
                    className={`badge ${
                      group.PrivacyType === "Private"
                        ? "badge-private"
                        : "badge-public"
                    }`}
                  >
                    {group.PrivacyType}
                  </span>

                  <span className="badge badge-role">{group.RoleType}</span>
                </div>

                <p className="group-card-description">{group.Description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="groups-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Discover</p>
            <h2>Find Groups</h2>
          </div>
        </div>

        <div className="group-search-bar">
          <input
            className="input-field"
            type="text"
            placeholder="Search by group name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchGroups()}
          />

          <button className="btn btn-primary" onClick={handleSearchGroups}>
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="groups-list">
            {searchResults.map((group) => (
              <article key={group.GroupID} className="group-card">
                <div className="group-card-header">
                  <div className="group-avatar">
                    {group.GroupName?.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="group-card-name">{group.GroupName}</h3>
                    <p className="group-card-category">
                      {group.StudyCategory}
                    </p>
                  </div>
                </div>

                <div className="group-card-meta">
                  <span
                    className={`badge ${
                      group.PrivacyType === "Private"
                        ? "badge-private"
                        : "badge-public"
                    }`}
                  >
                    {group.PrivacyType}
                  </span>
                </div>

                <p className="group-card-description">{group.Description}</p>

                <div className="group-card-footer">
                 {group.CurrentUserStatus === "Accepted" ? (
                    <p className="group-status joined">Joined</p>
                  ) : group.CurrentUserStatus === "Pending" ? (
                    <p className="group-status pending">Request Sent</p>
                ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleJoinGroup(group.GroupID)}
                >
                  {group.PrivacyType === "Private"
                    ? "Request to Join"
                    : "Join Group"}
               </button>
            )}
        </div>
              </article>
            ))}
          </div>
        )}

        {searchTerm.trim() && searchResults.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">?</div>
            <h3>No groups found</h3>
            <p>No groups matched "{searchTerm}". Try another search.</p>
          </div>
        )}
      </section>
    </main>
  );
}