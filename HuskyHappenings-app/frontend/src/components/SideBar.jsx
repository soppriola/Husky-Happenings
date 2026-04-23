import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import "./Sidebar.css";

export default function Sidebar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function loadNotifications() {
      if (!isAuthenticated) return;

      try {
        const response = await fetch("https://localhost:5000/api/notifications", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          const unreadExists = data.some((notification) => !notification.IsRead);
          setHasUnreadNotifications(unreadExists);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    }

    loadNotifications();
  }, [isAuthenticated]);

  const isActivePage = (path) => location.pathname === path;

  const NavLink = ({ to, icon, children, className = "", onClick }) => {
    const isActive = to ? isActivePage(to) : false;
    const Component = onClick ? "button" : Link;

    return (
      <Component
        to={onClick ? undefined : to}
        onClick={onClick}
        className={`nav-link ${isActive ? "active" : ""} ${className}`}
      >
        <span className="nav-icon">{icon}</span>
        <span className="nav-text">{children}</span>
      </Component>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <div className="logo-mark">HH</div>
          <div>
            <h1 className="sidebar-title">HuskyHappenings</h1>
            <p className="sidebar-subtitle">University Social Hub</p>
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <p className="section-title">Main</p>

          <NavLink to="/" icon="⌂">
            Home Feed
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/profile" icon="○">
                My Profile
              </NavLink>

              <NavLink to="/messages" icon="✉">
                Messages
              </NavLink>

              <NavLink to="/notifications" icon="•" className="notification-link">
                Notifications
                {hasUnreadNotifications && (
                  <span className="notification-badge"></span>
                )}
              </NavLink>

              <NavLink to="/groups" icon="◇">
                Groups
              </NavLink>
            </>
          )}
        </div>

        {isAuthenticated && (
          <div className="nav-section">
            <p className="section-title">Campus</p>

            <NavLink to="/events" icon="□">
              Events
            </NavLink>

            <NavLink to="/jobs" icon="▣">
              Job Board
            </NavLink>

            <NavLink to="/mentorship" icon="△">
              Mentorship
            </NavLink>
          </div>
        )}

        {isAuthenticated && (
          <div className="nav-section">
            <p className="section-title">Account</p>

            <NavLink to="/settings" icon="⚙">
              Settings
            </NavLink>

            <NavLink onClick={logout} icon="↗" className="logout-btn">
              Logout
            </NavLink>
          </div>
        )}
      </nav>

      {isAuthenticated && user && (
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {user.username ? user.username.charAt(0).toUpperCase() : "U"}
            </div>

            <div className="user-info">
              <p className="user-name">{user.username || "User"}</p>
              <p className="user-status">Active now</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}