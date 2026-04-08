import Feed from "../components/Feed";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        padding: "30px",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Husky Happenings
      </h1>

      <Feed />
    </div>
  );
}