import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreatePostPage() {
  const [content, setContent] = useState("");
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const response = await fetch("https://localhost:5000/api/groups/my", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          setGroups(data);
        } else {
          setError(data.error || "Failed to load groups");
        }
      } catch (err) {
        setError("Failed to load groups");
      }
    };

    loadGroups();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    try {
      const response = await fetch("https://localhost:5000/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content,
          groupId: groupId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/");
      } else {
        setError(data.error || "Failed to create post");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>Create a Post</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "15px",
            marginBottom: "12px",
            boxSizing: "border-box",
            backgroundColor: "white",
          }}
        >
          <option value="">Post to my page</option>
          {groups.map((group) => (
            <option key={group.GroupID} value={group.GroupID}>
              {group.GroupName} ({group.StudyCategory})
            </option>
          ))}
        </select>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What’s happening at USM?"
          rows="6"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            resize: "none",
            fontSize: "15px",
            marginBottom: "12px",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Post
        </button>
      </form>
    </div>
  );
}