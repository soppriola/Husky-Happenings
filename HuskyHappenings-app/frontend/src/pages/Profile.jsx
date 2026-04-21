import {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import "./Profile.css";
import {useAuth} from "../context/AuthContext.jsx";
import DatePicker from "react-datepicker";

export default function Profile() {
  const {currentUser} = useAuth();
  const {userId} = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const isOwnProfile = !userId || parseInt(userId) === currentUser?.user_id;

  // Form fields for editing
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [userType, setUserType] = useState("");
  const [major, setMajor] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [department, setDepartment] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [degreeEarned, setDegreeEarned] = useState("");
  const [currentEmployer, setCurrentEmployer] = useState("");


  useEffect(() => {
    async function loadProfile(userID) {
      try {
        const response = await fetch(`https://localhost:5000/api/profile/${userID}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load profile.");
          return;
        }

        setProfile(data);
        setUserType(data.user_type || "");

      } catch (err) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    
    const profileUserID = userId || currentUser?.user_id;
    if (profileUserID) {
      loadProfile(profileUserID);
    }
  }, [userId, currentUser?.user_id]);

  function initializeFormFields() {
    if (profile) {
      setEmail(profile.email || "");
      setName(profile.name || "");
      setPhoneNumber(profile.phone_number || "");
      setBirthDate(profile.birth_date || "");
      setBio(profile.bio || "");
      setPictureUrl(profile.picture_url || "");
      setUserType(profile.user_type || "");
      setMajor(profile.major || "");
      setGraduationYear(profile.graduation_year || "");
      setDepartment(profile.department || "");
      setOfficeLocation(profile.office_location || "");
      setDegreeEarned(profile.degree_earned || "");
      setCurrentEmployer(profile.current_employer || "");
      setSaveError("");
    }
  }

  async function handleEdit() {
    initializeFormFields();
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");

    try {
      const payload = {
        email,
        name,
        phoneNumber,
        birthDate,
        bio,
        pictureUrl,
        userType,
        major: userType === "Student" ? major : undefined,
        graduationYear: ["Student", "Alumni"].includes(userType) ? graduationYear : undefined,
        department: userType === "Faculty" ? department : undefined,
        officeLocation: userType === "Faculty" ? officeLocation : undefined,
        degreeEarned: userType === "Alumni" ? degreeEarned : undefined,
        currentEmployer: userType === "Alumni" ? currentEmployer : undefined,
      };

      const response = await fetch("https://localhost:5000/api/profile/edit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setSaveError(data.error || "Failed to save profile.");
        return;
      }

      // Refresh profile data
      const profileResponse = await fetch(`https://localhost:5000/api/profile/${currentUser.user_id}`, {
        credentials: "include",
      });
      const updatedProfile = await profileResponse.json();
      setProfile(updatedProfile);
      setEditing(false);

    } catch (err) {
      setSaveError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    setEditing(false);
    setSaveError("");
  }

  if (loading) return <div className="profile-page">Loading...</div>;
  if (error) return <div className="profile-page">{error}</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img src={profile.picture_url || "https://via.placeholder.com/120"} alt="Avatar" className="profile-avatar"/>
        <h2 className="profile-name">{profile.name}</h2>
        {userType && <p className="profile-role">{userType}</p>}
        <p className="profile-bio">{profile.bio}</p>
        {!editing && isOwnProfile ? (
          <button className="edit-profile-button" onClick={handleEdit}>Edit Profile</button>
        ) : editing ? (
          <form className="edit-profile-form" onSubmit={handleSave}>
            {saveError && <div className="form-error">{saveError}</div>}
            
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-group">
                <label>Email:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Name:</label> 
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone Number:</label>
                <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Birth Date:</label>
                <DatePicker selected={birthDate ? new Date(birthDate) : null} onChange={(date) => setBirthDate(date ? date.toISOString().split("T")[0] : "")} dateFormat="MM-dd-yyyy" />
              </div>
              <div className="form-group">
                <label>Bio:</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Picture URL:</label>
                <input type="text" value={pictureUrl} onChange={(e) => setPictureUrl(e.target.value)} />
              </div>
            </div>

            {userType === "Student" && (
              <div className="form-section role-section">
                <h3>Student Information</h3>
                <div className="form-group">
                  <label>Major:</label>
                  <input type="text" value={major} onChange={(e) => setMajor(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Graduation Year:</label>
                  <input type="number" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
                </div>
              </div>
            )}

            {userType === "Faculty" && (
              <div className="form-section role-section">
                <h3>Faculty Information</h3>
                <div className="form-group">
                  <label>Department:</label>
                  <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Office Location:</label>
                  <input type="text" value={officeLocation} onChange={(e) => setOfficeLocation(e.target.value)} />
                </div>
              </div>
            )}

            {userType === "Alumni" && (
              <div className="form-section role-section">
                <h3>Alumni Information</h3>
                <div className="form-group">
                  <label>Graduation Year:</label>
                  <input type="number" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Degree Earned:</label>
                  <input type="text" value={degreeEarned} onChange={(e) => setDegreeEarned(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Current Employer:</label>
                  <input type="text" value={currentEmployer} onChange={(e) => setCurrentEmployer(e.target.value)} />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="save-profile-button" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" className="cancel-profile-button" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}