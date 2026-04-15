import {useState, useEffect} from "react";
import "./Profile.css";
import {useAuth} from "../context/AuthContext.jsx";

export default function Profile() {
  const {currentUser} = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(`https://localhost:5000/api/profile/${currentUser.user_id}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load profile.");
          return;
        }

        setProfile(data);

      } catch (err) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    
    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  if (loading) return <div className="profile-page">Loading...</div>;
  if (error) return <div className="profile-page">{error}</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img src={profile.picture_url} alt="Avatar" className="profile-avatar"/>
        <h2 className="profile-name">{profile.name}</h2>
        <p className="profile-bio">{profile.bio}</p>
      </div>
    </div>
  );
}