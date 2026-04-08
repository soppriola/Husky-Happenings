import Post from "./Post";

export default function Feed() {
  const samplePosts = [
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
  ];

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>News Feed</h2>

      {samplePosts.map((post) => (
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