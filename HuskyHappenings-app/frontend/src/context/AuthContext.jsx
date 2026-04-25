import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Handles authentication of users session
export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("https://localhost:5000/api/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          setCurrentUser(null);
        } else {
          const data = await response.json();
          setCurrentUser(data);
        }
      } catch {
        setCurrentUser(null);
      }
      setLoading(false);
    }

    checkSession();
  }, []);

  const login = async (userData = null) => {
    if (userData) {
      setCurrentUser(userData);
      return;
    }

    try {
      const response = await fetch("https://localhost:5000/api/me", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        setCurrentUser(null);
      } else {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  const logout = async () => {
    try {
      await fetch("https://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
    } finally {
      setCurrentUser(null);
    }
  };

  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{ loading, currentUser, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}