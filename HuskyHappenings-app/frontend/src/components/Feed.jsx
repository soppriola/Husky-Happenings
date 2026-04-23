import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Post from "./Post";
import "./Feed.css";

export default function Feed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

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

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <section className="feed">
      <div className="feed-topbar">
        <div>
          <p className="feed-kicker">Your Personalized Feed</p>
          <h2></h2>
        </div>

        <button
          className="feed-create-btn"
          onClick={() => navigate("/create-post")}
        >
          Create Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="feed-empty-state">
          <div className="feed-empty-icon">HH</div>
          <h3>No posts yet</h3>
          <p>Be the first to share something with the HuskyHappenings community.</p>
        </div>
      ) : (
        <div className="feed-post-list">
          {posts.map((post) => (
            <Post
              key={post.POST_ID}
              postId={post.POST_ID}
              author={post.AUTHOR}
              content={post.CONTENT}
              time={post.CREATED_AT}
              likeCount={post.LIKE_COUNT || 0}
              onRefresh={loadPosts}
              sharedPostId={post.SHARED_POST_ID}
              originalContent={post.ORIGINAL_CONTENT}
              originalAuthor={post.ORIGINAL_AUTHOR}
            />
          ))}
        </div>
      )}
    </section>
  );
}