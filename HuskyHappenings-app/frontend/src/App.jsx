import { useState } from 'react'
import './App.css'

import Landing from "./pages/Landing.jsx"
import Home from "./pages/Home.jsx"
import Signup from "./pages/Signup.jsx"
import Login from "./pages/Login.jsx"
import Profile from "./pages/Profile.jsx"
import Settings from "./pages/Settings.jsx"
import Messages from "./pages/Messages.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      Testing
    </>
  )
}

export default App
