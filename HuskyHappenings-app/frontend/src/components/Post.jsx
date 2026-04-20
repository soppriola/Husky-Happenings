import { useState } from "react";

export default function Post({ postId, author, content, time, likeCount, onRefresh }) {
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    try {
      setLoading(true);

      const response = await fetch(`https://localhost:5000/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.error || "Failed to like post");
      } else {
        onRefresh();
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #dcdcdc",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "16px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <h3 style={{ margin: "0", fontSize: "18px" }}>{author}</h3>
        <p style={{ margin: "4px 0 0 0", color: "gray", fontSize: "14px" }}>
          {time}
        </p>
      </div>

      <p style={{ margin: "12px 0", fontSize: "16px", lineHeight: "1.5" }}>
        {content}
      </p>

      <div style={{ display: "flex", gap: "16px", marginTop: "12px", alignItems: "center" }}>
        <button onClick={handleLike} disabled={loading}>
          {loading ? "Liking..." : "Like"}
        </button>
        <span>{likeCount} likes</span>
        <button>Comment</button>
        <button>Share</button>
      </div>
    </div>
  );
}