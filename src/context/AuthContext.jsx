
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiRequest } from "../../server/src/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const data = await apiRequest("/auth/me");

        if (active) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function signup({ name, email, password }) {
    const data = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    setUser(data.user);
    return data.user;
  }

  async function login({ email, password }) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await apiRequest("/auth/logout", {
      method: "POST",
    });

    setUser(null);
  }

  async function updateProfile({ name, email }) {
    const data = await apiRequest("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ name, email }),
    });

    setUser(data.user);
    return data.user;
  }

  async function changePassword({ currentPassword, newPassword }) {
    return apiRequest("/auth/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
