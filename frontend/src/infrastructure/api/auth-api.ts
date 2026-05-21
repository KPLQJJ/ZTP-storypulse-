import type { IAuthApi } from '@/core/api/auth'
import type { RegisterRequest, LoginRequest, TokenResponse, UserOut } from '@/core/api/types'
import { http } from '@/infrastructure/http-client'
import { useAuthStore } from '@/infrastructure/stores/auth-store'

export const authApi: IAuthApi = {
  async register(req: RegisterRequest): Promise<TokenResponse> {
    const data = await http.post<TokenResponse>('/auth/register', req)
    const user = await http.get<UserOut>('/auth/me')
    useAuthStore.getState().setUser(user)
    return data
  },

  async login(req: LoginRequest): Promise<TokenResponse> {
    const data = await http.post<TokenResponse>('/auth/login', req)
    const user = await http.get<UserOut>('/auth/me')
    useAuthStore.getState().setUser(user)
    return data
  },

  async me(): Promise<UserOut> {
    return http.get<UserOut>('/auth/me')
  },

  async logout(): Promise<void> {
    await http.post<void>('/auth/logout')
    useAuthStore.getState().logout()
  },
}
