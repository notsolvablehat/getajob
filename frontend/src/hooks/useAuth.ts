import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";

interface TokenResponse {
  access_token: string;
  token_type: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const data = await api.loginForm<TokenResponse>(email, password);
      setToken(data.access_token);
      return data;
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      await api.post("/api/auth/register", payload);
      // Auto-login after registration
      const data = await api.loginForm<TokenResponse>(
        payload.email,
        payload.password,
      );
      setToken(data.access_token);
      return data;
    },
  });
}
