'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "./auth";
import { apiClient } from "./apiClient";
import { JwtUser } from "./types";

interface AuthState {
  user: JwtUser | null;
  loading: boolean;
}

export const useAuthGuard = (): AuthState => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      setState({ user: null, loading: false });
      return;
    }

    const verify = async (): Promise<void> => {
      try {
        const data = await apiClient<{ user: JwtUser }>("/auth/me", {
          method: "GET",
        });
        setState({ user: data.user, loading: false });
      } catch (err) {
        clearToken();
        router.push("/auth/login");
        setState({ user: null, loading: false });
      }
    };

    void verify();
  }, [router]);

  return state;
};
