import './App.css'
import { useState } from 'react'
import { Link, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing.jsx"
import Home from "./pages/Home.jsx"
import Signup from "./pages/Signup.jsx"
import Login from "./pages/Login.jsx"
import Profile from "./pages/Profile.jsx"
import Settings from "./pages/Settings.jsx"
import Messages from "./pages/Messages.jsx"
// import ProtectedRoute from "./components/ProtectedRoute.jsx"

function App() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>|
        <Link to="/signup">Sign Up</Link>|
        <Link to="/login">Log In</Link>|
        <Link to="/profile">Profile</Link>|
        <Link to="/settings">Settings</Link>|
        <Link to="/messages">Messages</Link>

      </nav>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/messages" element={<Messages />} />
      </Routes>
    </>
  );
}

export default App
