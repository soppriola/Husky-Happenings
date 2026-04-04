import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function useAuth(){
  return useContext(AuthContext);
}

// Handles authentication of users session
export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("https://localhost:5000/api/me", {
          method: "GET",
          credentials: "include",
       });

        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
      setLoading(false);
    }

    checkSession();
  },
[]);

  const login = async () => {
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await fetch("https://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include",
    });
    setIsAuthenticated(false);
  };

  return (<AuthContext.Provider  value={{ loading, isAuthenticated, login, logout, }}> {children} </AuthContext.Provider>);
}