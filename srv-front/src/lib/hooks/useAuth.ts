/**
 * Authentication hooks for CellBlock
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { SignupInput, LoginInput } from '@cellblock/contracts';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient.getProfile(),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) => apiClient.login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupInput) => apiClient.signup(data),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    user: user?.user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
  };
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => apiClient.verifyEmail(token),
  });
}

export function usePasswordReset() {
  const requestMutation = useMutation({
    mutationFn: (email: string) => apiClient.requestPasswordReset(email),
  });

  const resetMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      apiClient.resetPassword(token, password),
  });

  return {
    requestReset: requestMutation.mutateAsync,
    resetPassword: resetMutation.mutateAsync,
    isRequesting: requestMutation.isPending,
    isResetting: resetMutation.isPending,
  };
}
