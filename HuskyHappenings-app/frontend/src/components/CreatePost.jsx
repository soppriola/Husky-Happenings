import { useState } from "react";

export default function CreatePost({ onAddPost }) {
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    onAddPost(content);
    setContent("");
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #dcdcdc",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "20px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Create a Post</h3>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Insert Text Here"
          rows="4"
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