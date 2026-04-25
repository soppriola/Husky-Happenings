// Author: Ashley Pike
// Allows a user to specify information to be used in the creation
// of a new user account for MainePad Finder
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import DatePicker from "react-datepicker";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [userType, setUserType] = useState("student");
  const [major, setMajor] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [department, setDepartment] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [degreeEarned, setDegreeEarned] = useState("");
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const body = {
      username,
      password,
      email,
      name,
      phoneNumber,
      birthDate,
      userType,
      major,
      graduationYear,
      department,
      officeLocation,
      degreeEarned,
      currentEmployer,
    };

    try {
      const response = await fetch("https://localhost:5000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
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
  };

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <br />
        <div>
          <p>Select user type:</p>
          <label>
            <input
              type="radio"
              name="userType"
              value="Student"
              checked={userType === "Student"}
              onChange={(e) => setUserType(e.target.value)}
            />
            Student
          </label>

          <label>
            <input
              type="radio"
              name="userType"
              value="Alumni"
              checked={userType === "Alumni"}
              onChange={(e) => setUserType(e.target.value)}
            />
            Alumni
          </label>

          <label>
            <input
              type="radio"
              name="userType"
              value="Faculty"
              checked={userType === "Faculty"}
              onChange={(e) => setUserType(e.target.value)}
            />
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
          <DatePicker selected={birthDate ? new Date(birthDate) : null} onChange={(date) => setBirthDate(date ? date.toISOString().split("T")[0] : "")} dateFormat="MM-dd-yyyy" />
        </div>

        {userType === "Student" && (
          <>
            <div>
              <label>Major:</label>
              <input type="text" value={major} onChange={(e) => setMajor(e.target.value)} required />
            </div>
            <div>
              <label>Graduation Year:</label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {userType === "Faculty" && (
          <>
            <div>
              <label>Department:</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required />
            </div>
            <div>
              <label>Office Location:</label>
              <input type="text" value={officeLocation} onChange={(e) => setOfficeLocation(e.target.value)} required />
            </div>
          </>
        )}

        {userType === "Alumni" && (
          <>
            <div>
              <label>Graduation Year:</label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Degree Earned:</label>
              <input type="text" value={degreeEarned} onChange={(e) => setDegreeEarned(e.target.value)} required />
            </div>
            <div>
              <label>Current Employer:</label>
              <input type="text" value={currentEmployer} onChange={(e) => setCurrentEmployer(e.target.value)} required />
            </div>
          </>
        )}

        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}
