import "./App.css";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Sidebar from "./components/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import Messages from "./pages/Messages.jsx";

// Arianna imports
import EventsPage from "./components/Events/EventsPage.jsx";
import JobBoardPage from "./components/JobBoard/JobBoardPage.jsx";
import MentorshipPage from "./components/Mentorship/MentorshipPage.jsx";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/landing"
            element={
              <ProtectedRoute>
                <Landing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobBoardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mentorship"
            element={
              <ProtectedRoute>
                <MentorshipPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;