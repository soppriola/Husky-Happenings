import {Link} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import "./Sidebar.css";

export default function Sidebar() {
  const {isAuthenticated, logout} = useAuth();

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">HuskyHappenings</h2>

      <nav className="sidebar-nav">
        <Link to="/">Home</Link>

{isAuthenticated ? (
  <>
    <button onClick={logout}>Logout</button>
    <Link to="/profile">Profile</Link>
    <Link to="/settings">Settings</Link>
    <Link to="/messages">Messages</Link>
    <Link to="/events">Events</Link>
    <Link to="/jobs">Job Board</Link>
    <Link to="/mentorship">Mentorship</Link>
  </>
) : (
  <>
    <Link to="/signup">Sign Up</Link>
    <Link to="/login">Log In</Link>
  </>
)}
      </nav>
    </aside>
  );
}
