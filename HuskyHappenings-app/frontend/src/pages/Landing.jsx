import Feed from "../components/Feed";
import "./Landing.css";

export default function Landing() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div>
          <p className="landing-eyebrow">Campus Community</p>
          <h1 className="landing-title">Welcome to HuskyHappenings</h1>
          <p className="landing-description">
            Stay connected with classmates, groups, events, and conversations
            happening around campus.
          </p>
        </div>

        <div className="landing-hero-card">
          <p className="hero-card-label">Today</p>
          <h3>See what your campus is talking about</h3>
          <p>Browse posts, updates, and community activity in one place.</p>
        </div>
      </section>

      <section className="feed-section">
        <div className="feed-header">
          <div>
            <p className="section-kicker">Live Feed</p>
            <h2>Latest campus posts</h2>
          </div>
        </div>

        <Feed />
      </section>
    </main>
  );
}