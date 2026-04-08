export default function Post({ author, content, time }) {
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

      <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
        <button>Like</button>
        <button>Comment</button>
        <button>Share</button>
      </div>
    </div>
  );
}