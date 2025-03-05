import { useEffect } from "react";
import { useAuthStore } from "./authStore";
import { User } from "@/lib/db/schema";
import {
  login as loginApi,
  logout as logoutApi,
  getUser as getUserApi,
} from "@/lib/auth/session";

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setIsAuthenticated,
    setIsLoading,
    setError,
    logout: clearAuthState,
  } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);

        // Fetch user data from API
        const response = await fetch("/api/auth/user", {
          credentials: "include", // Important for sending cookies
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            clearAuthState();
          }
        } else {
          clearAuthState();
        }
      } catch (err) {
        console.error("Auth error:", err);
        setError("Erro de autenticação");
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [setUser, setIsAuthenticated, setIsLoading, setError, clearAuthState]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important for receiving cookies
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Falha na autenticação");
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Erro ao fazer login");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include", // Important for receiving cookies
      });

      if (response.ok) {
        const newUser = await response.json();
        setUser(newUser);
        setIsAuthenticated(true);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Falha no registro");
        return false;
      }
    } catch (err) {
      console.error("Register error:", err);
      setError("Erro ao registrar");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important for sending cookies
      });

      clearAuthState();
      return true;
    } catch (err) {
      console.error("Logout error:", err);
      setError("Erro ao fazer logout");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.id) {
        setError("Usuário não autenticado");
        return false;
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include", // Important for sending cookies
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Falha ao atualizar perfil");
        return false;
      }
    } catch (err) {
      console.error("Update profile error:", err);
      setError("Erro ao atualizar perfil");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    signOut,
    updateProfile,
  };
}
