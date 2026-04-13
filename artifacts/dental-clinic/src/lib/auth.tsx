import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetCurrentUser, useLogin, useLogout, useRegister } from "@workspace/api-client-react";
import { User, LoginBody, RegisterBody } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  register: (data: RegisterBody) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading: isUserLoading, refetch } = useGetCurrentUser({
    query: {
      retry: false,
    }
  });
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const login = async (data: LoginBody) => {
    try {
      await loginMutation.mutateAsync({ data });
      await refetch();
      toast({ title: "Logged in successfully" });
      setLocation("/");
    } catch (error: any) {
      toast({ 
        title: "Login failed", 
        description: error.message || "Please check your credentials",
        variant: "destructive"
      });
      throw error;
    }
  };

  const register = async (data: RegisterBody) => {
    try {
      await registerMutation.mutateAsync({ data });
      await refetch();
      toast({ title: "Registered successfully" });
      setLocation("/");
    } catch (error: any) {
      toast({ 
        title: "Registration failed", 
        description: error.message || "Please check your details",
        variant: "destructive"
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      await refetch();
      toast({ title: "Logged out successfully" });
      setLocation("/login");
    } catch (error: any) {
      toast({ 
        title: "Logout failed", 
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: isUserLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
