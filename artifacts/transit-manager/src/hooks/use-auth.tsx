import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("transit_token"));
  const [location, setLocation] = useLocation();
  
  const { data: user, isLoading: isUserLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const login = (newToken: string) => {
    localStorage.setItem("transit_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("transit_token");
    setToken(null);
    setLocation("/login");
  };

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError]);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isUserLoading && !!token,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
