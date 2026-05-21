import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/infrastructure/api/auth-api'
import type { LoginRequest, RegisterRequest } from '@/core/api/types'

export function useLogin(redirectTo = '/novels') {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (req: LoginRequest) => authApi.login(req),
    onSuccess: () => navigate(redirectTo),
  })
}

export function useRegister(redirectTo = '/novels') {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (req: RegisterRequest) => authApi.register(req),
    onSuccess: () => navigate(redirectTo),
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogout() {
  const navigate = useNavigate()

  return () => {
    authApi.logout()
    navigate('/login')
  }
}
