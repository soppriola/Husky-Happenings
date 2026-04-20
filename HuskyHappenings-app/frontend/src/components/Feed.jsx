import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Post from "./Post";

export default function Feed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function loadPosts() {
      try {
        const response = await fetch("https://localhost:5000/api/posts", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          setPosts(data);
        } else {
          console.error(data.error || "Failed to load posts");
        }
      } catch (error) {
        console.error("Error loading posts:", error);
      }
    }

    loadPosts();
  }, []);

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>News Feed</h2>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/create-post")}
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
          Create Post
        </button>
      </div>

      {posts.map((post) => (
        <Post
          key={post.POST_ID}
          author={post.USERNAME}
          content={post.CONTENT}
          time={post.CREATED_AT}
        />
      ))}
    </div>
  );
}