import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Profile.css";
import { useAuth } from "../context/AuthContext.jsx";
import DatePicker from "react-datepicker";

export default function Profile() {
  const { currentUser } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [messagingLoading, setMessagingLoading] = useState(false);

  const isOwnProfile = !userId || parseInt(userId) === currentUser?.user_id;

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
        const response = await fetch(
          `https://localhost:5000/api/profile/${userID}`,
          {
            credentials: "include",
          }
        );

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
        graduationYear: ["Student", "Alumni"].includes(userType)
          ? graduationYear
          : undefined,
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

      const profileResponse = await fetch(
        `https://localhost:5000/api/profile/${currentUser.user_id}`,
        {
          credentials: "include",
        }
      );

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

  async function handleMessage() {
    setMessagingLoading(true);

    try {
      const response = await fetch(
        `https://localhost:5000/api/conversations/direct/${parseInt(userId)}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to open conversation");
        return;
      }

      navigate("/messages");
    } catch (err) {
      alert("Failed to open conversation");
      console.error(err);
    } finally {
      setMessagingLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-status-card">Loading profile...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-page">
        <div className="profile-status-card profile-error">{error}</div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <div className="profile-cover"></div>

        <div className="profile-header">
          <img
            src={profile.picture_url || "https://via.placeholder.com/120"}
            alt="Avatar"
            className="profile-avatar"
          />

          <div className="profile-main-info">
            <p className="profile-eyebrow">Campus Profile</p>
            <h1 className="profile-name">{profile.name}</h1>

            {userType && <p className="profile-role">{userType}</p>}

            <p className="profile-bio">
              {profile.bio || "No bio added yet."}
            </p>
          </div>

          {!editing && isOwnProfile ? (
            <button className="edit-profile-button" onClick={handleEdit}>
              Edit Profile
            </button>
          ) : !editing && !isOwnProfile ? (
            <button
              className="message-profile-button"
              onClick={handleMessage}
              disabled={messagingLoading}
            >
              {messagingLoading ? "Opening..." : "Message"}
            </button>
          ) : null}
        </div>

        {!editing && (
          <div className="profile-details-grid">
            <div className="profile-detail-card">
              <span>Email</span>
              <p>{profile.email || "Not provided"}</p>
            </div>

            <div className="profile-detail-card">
              <span>Phone</span>
              <p>{profile.phone_number || "Not provided"}</p>
            </div>

            {userType === "Student" && (
              <>
                <div className="profile-detail-card">
                  <span>Major</span>
                  <p>{profile.major || "Not provided"}</p>
                </div>

                <div className="profile-detail-card">
                  <span>Graduation Year</span>
                  <p>{profile.graduation_year || "Not provided"}</p>
                </div>
              </>
            )}

            {userType === "Faculty" && (
              <>
                <div className="profile-detail-card">
                  <span>Department</span>
                  <p>{profile.department || "Not provided"}</p>
                </div>

                <div className="profile-detail-card">
                  <span>Office Location</span>
                  <p>{profile.office_location || "Not provided"}</p>
                </div>
              </>
            )}

            {userType === "Alumni" && (
              <>
                <div className="profile-detail-card">
                  <span>Graduation Year</span>
                  <p>{profile.graduation_year || "Not provided"}</p>
                </div>

                <div className="profile-detail-card">
                  <span>Degree Earned</span>
                  <p>{profile.degree_earned || "Not provided"}</p>
                </div>

                <div className="profile-detail-card">
                  <span>Current Employer</span>
                  <p>{profile.current_employer || "Not provided"}</p>
                </div>
              </>
            )}
          </div>
        )}

        {editing && (
          <form className="edit-profile-form" onSubmit={handleSave}>
            {saveError && <div className="form-error">{saveError}</div>}

            <div className="form-section">
              <div className="form-section-header">
                <p>Profile Settings</p>
                <h2>Basic Information</h2>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Birth Date</label>
                  <DatePicker
                    selected={birthDate ? new Date(birthDate) : null}
                    onChange={(date) =>
                      setBirthDate(
                        date ? date.toISOString().split("T")[0] : ""
                      )
                    }
                    dateFormat="MM-dd-yyyy"
                    className="profile-datepicker"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the campus community a little about yourself..."
                />
              </div>

              <div className="form-group">
                <label>Picture URL</label>
                <input
                  type="text"
                  value={pictureUrl}
                  onChange={(e) => setPictureUrl(e.target.value)}
                  placeholder="Paste an image URL"
                />
              </div>
            </div>

            {userType === "Student" && (
              <div className="form-section role-section">
                <div className="form-section-header">
                  <p>Role Details</p>
                  <h2>Student Information</h2>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Major</label>
                    <input
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Graduation Year</label>
                    <input
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {userType === "Faculty" && (
              <div className="form-section role-section">
                <div className="form-section-header">
                  <p>Role Details</p>
                  <h2>Faculty Information</h2>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Office Location</label>
                    <input
                      type="text"
                      value={officeLocation}
                      onChange={(e) => setOfficeLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {userType === "Alumni" && (
              <div className="form-section role-section">
                <div className="form-section-header">
                  <p>Role Details</p>
                  <h2>Alumni Information</h2>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Graduation Year</label>
                    <input
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Degree Earned</label>
                    <input
                      type="text"
                      value={degreeEarned}
                      onChange={(e) => setDegreeEarned(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Current Employer</label>
                    <input
                      type="text"
                      value={currentEmployer}
                      onChange={(e) => setCurrentEmployer(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="save-profile-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="cancel-profile-button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}