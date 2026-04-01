// Author: Ashley Pike
// Allows a user to specify information to be used in the creation
// of a new user account for MainePad Finder
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [userType, setUserType] = useState("Student")
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password != confirmPassword) {
      setError("Passwords do not match")
      return;
    }

    try {
      const response = await fetch ("https://localhost:5000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({username, password, email, name, phoneNumber, birthDate, userType}),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/login");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Network error");
    }
  }

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <p style={{color: "red"}}>{error}</p>}
      <form onSubmit={handleSubmit}>

        <br />
        <div>
          <p>Select user type:</p>
          <label>
            <input type="radio" name="userType" value="Student" checked={userType === "Student"} onChange={(e) => setUserType(e.target.value)} />
            Student
          </label>
            
          <label>
            <input type="radio" name="userType" value="Alumni" checked={userType === "Alumni"} onChange={(e) => setUserType(e.target.value)} />
            Alumni
          </label>
          
          <label>
            <input type="radio" name="userType" value="Faculty" checked={userType === "Faculty"} onChange={(e) => setUserType(e.target.value)} />
            Faculty
          </label>
        </div>


        <div>
          <label>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div>
          <label>Confirm Password:</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>

        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label>Phone Number:</label>
          <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
        </div>

        <div>
          <label>Birth Date:</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /> 
        </div>
        

        <button type="submit">
          Sign Up
        </button>
      </form>
    </div>
  );
}
