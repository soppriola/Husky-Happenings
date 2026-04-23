import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import "./Sidebar.css";

export default function Sidebar() {
  const { isAuthenticated, logout } = useAuth();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      if (!isAuthenticated) return;

      try {
        const response = await fetch("http://localhost:5000/api/notifications", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          const unreadExists = data.some(
            (notification) => !notification.IsRead
          );
          setHasUnreadNotifications(unreadExists);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    }

    loadNotifications();
  }, [isAuthenticated]);

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

            <Link to="/notifications" className="notification-link">
              Notifications
              {hasUnreadNotifications && <span className="red-dot"></span>}
            </Link>

            <Link to="/groups">Groups</Link>
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