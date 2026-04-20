import { useState } from "react";
import Post from "./Post";
import CreatePost from "./CreatePost";

export default function Feed() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "John Smith",
      content: "This is my first post on the USM networking platform.",
      time: "2 hours ago",
    },
    {
      id: 2,
      author: "Jane Doe",
      content: "Looking for people to join a software engineering study group.",
      time: "4 hours ago",
    },
    {
      id: 3,
      author: "Alex Brown",
      content: "Reminder: career fair is happening this Friday in the student center.",
      time: "1 day ago",
    },
  ]);

  const handleAddPost = (newContent) => {
    const newPost = {
      id: Date.now(),
      author: "You",
      content: newContent,
      time: "Just now",
    };

    setPosts([newPost, ...posts]);
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>News Feed</h2>

      <CreatePost onAddPost={handleAddPost} />

      {posts.map((post) => (
        <Post
          key={post.id}
          author={post.author}
          content={post.content}
          time={post.time}
        />
      ))}
    </div>
  );
}