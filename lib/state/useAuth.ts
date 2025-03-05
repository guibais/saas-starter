import { useEffect } from "react";
import { useAuthStore } from "./authStore";
import { getSession } from "@/lib/auth/session";
import { User } from "@/lib/db/schema";

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
    logout,
  } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const session = await getSession();

        if (session && session.user) {
          // Fetch user data from API
          const response = await fetch(`/api/users/${session.user.id}`);

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            setError("Falha ao carregar dados do usuário");
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        setError("Erro de autenticação");
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [setUser, setIsAuthenticated, setIsLoading, setError, logout]);

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
      });

      logout();
      return true;
    } catch (err) {
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
