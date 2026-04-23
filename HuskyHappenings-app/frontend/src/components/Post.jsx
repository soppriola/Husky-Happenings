import { useEffect, useState } from "react";

export default function Post({
  postId,
  author,
  content,
  time,
  likeCount,
  onRefresh,
  sharedPostId,
  originalContent,
  originalAuthor,
}) {
  const [loading, setLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);

  const loadComments = async () => {
    try {
      const response = await fetch(`https://localhost:5000/api/posts/${postId}/comments`, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setComments(data);
      } else {
        console.error(data.error || "Failed to load comments");
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const handleLike = async () => {
    try {
      setLoading(true);

      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
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

  const handleShare = async () => {
    try {
      setShareLoading(true);

      const response = await fetch(`http://localhost:5000/api/posts/${postId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: "" }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.error || "Failed to share post");
      } else {
        onRefresh();
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: commentText }),
      });

      const data = await response.json();

      if (response.ok) {
        setCommentText("");
        loadComments();
      } else {
        console.error(data.error || "Failed to create comment");
      }
    } catch (error) {
      console.error("Network error:", error);
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
        {sharedPostId ? (
          <h3 style={{ margin: "0", fontSize: "18px" }}>
            {author} shared {originalAuthor}'s post
          </h3>
        ) : (
          <h3 style={{ margin: "0", fontSize: "18px" }}>{author}</h3>
        )}

        <p style={{ margin: "4px 0 0 0", color: "gray", fontSize: "14px" }}>
          {time}
        </p>
      </div>

      {content && content.trim() !== "" && (
        <p style={{ margin: "12px 0", fontSize: "16px", lineHeight: "1.5" }}>
          {content}
        </p>
      )}

      {sharedPostId && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "12px",
            marginTop: "12px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
            Original post by {originalAuthor}
          </p>
          <p style={{ margin: 0 }}>{originalContent}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", marginTop: "12px", alignItems: "center" }}>
        <button onClick={handleLike} disabled={loading}>
          {loading ? "Liking..." : "Like"}
        </button>
        <span>{likeCount} likes</span>
        <button onClick={() => setShowComments(!showComments)}>
          {showComments ? "Hide Comments" : "Comment"}
        </button>
        <button onClick={handleShare} disabled={shareLoading}>
          {shareLoading ? "Sharing..." : "Share"}
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: "16px" }}>
          <form onSubmit={handleCommentSubmit} style={{ marginBottom: "12px" }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                marginBottom: "8px",
                boxSizing: "border-box",
              }}
            />
            <button type="submit">Post Comment</button>
          </form>

          {comments.map((comment) => (
            <div
              key={comment.COMMENT_ID}
              style={{
                borderTop: "1px solid #eee",
                paddingTop: "8px",
                marginTop: "8px",
              }}
            >
              <strong>{comment.USERNAME}</strong>
              <p style={{ margin: "4px 0" }}>{comment.CONTENT}</p>
              <small style={{ color: "gray" }}>{comment.TIMESTAMP}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}