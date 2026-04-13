import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useGetCurrentUser, useLogin, useLogout, useRegister } from "@workspace/api-client-react";
import { User, LoginBody, RegisterBody } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  register: (data: RegisterBody) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_TOKEN_KEY = "royal_dental_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const token = getStoredToken();
  const { data: user, isLoading: isUserLoading, refetch } = useGetCurrentUser({
    query: {
      retry: false,
      enabled: !!token,
    }
  });
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const login = async (data: LoginBody) => {
    try {
      const result = await loginMutation.mutateAsync({ data });
      if (result.token) {
        setStoredToken(result.token);
      }
      await refetch();
      toast({ title: t("auth.loginSuccess") });
      const role = result.user?.role || "patient";
      setLocation(`/${role}/dashboard`);
    } catch (error: any) {
      toast({ 
        title: t("auth.loginFailed"), 
        description: error.message || t("auth.checkCredentials"),
        variant: "destructive"
      });
    }
  };

  const register = async (data: RegisterBody) => {
    try {
      const result = await registerMutation.mutateAsync({ data });
      if (result.token) {
        setStoredToken(result.token);
      }
      await refetch();
      toast({ title: t("auth.registerSuccess") });
      setLocation("/patient/dashboard");
    } catch (error: any) {
      toast({ 
        title: t("auth.registerFailed"), 
        description: error.message || t("auth.checkDetails"),
        variant: "destructive"
      });
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (_) {
    } finally {
      clearStoredToken();
      await refetch();
      toast({ title: t("auth.logoutSuccess") });
      setLocation("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: token ? isUserLoading : false, login, register, logout }}>
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
