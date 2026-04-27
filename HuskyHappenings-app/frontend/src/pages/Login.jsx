// Author: Ashley Pike
// Enables a user to login using their username and password
// Receives session token from backend

import { useState } from "react";
import { useSearchParams, useNavigate, replace, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";

export default function Login() {
  const [params] = useSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const redirectTo = params.get("redirect")
    ? decodeURIComponent(params.get("redirect"))
    : "/";

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login();
        navigate(redirectTo, replace);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo">HH</div>

          <div>
            <p className="login-eyebrow">Welcome back</p>
            <h1>Log in to HuskyHappenings</h1>
            <p className="login-subtitle">
            </p>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Log in
          </button>
        </form>

        <p className="login-footer">
          New to HuskyHappenings? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}