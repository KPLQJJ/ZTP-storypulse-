import type { IAuthApi } from '@/core/api/auth'
import type { RegisterRequest, LoginRequest, TokenResponse, UserOut } from '@/core/api/types'
import { http } from '@/infrastructure/http-client'
import { useAuthStore } from '@/infrastructure/stores/auth-store'

export const authApi: IAuthApi = {
  async register(req: RegisterRequest): Promise<TokenResponse> {
    const data = await http.post<TokenResponse>('/auth/register', req)
    useAuthStore.getState().setAuth(data.access_token, {
      id: data.user_id,
      username: data.username,
      email: '',
      role: data.role,
      is_active: 1,
      created_at: '',
    })
    // Fetch full user info
    const user = await http.get<UserOut>('/auth/me')
    useAuthStore.getState().setUser(user)
    return data
  },

  async login(req: LoginRequest): Promise<TokenResponse> {
    const data = await http.post<TokenResponse>('/auth/login', req)
    useAuthStore.getState().setAuth(data.access_token, {
      id: data.user_id,
      username: data.username,
      email: '',
      role: data.role,
      is_active: 1,
      created_at: '',
    })
    const user = await http.get<UserOut>('/auth/me')
    useAuthStore.getState().setUser(user)
    return data
  },

  async me(): Promise<UserOut> {
    return http.get<UserOut>('/auth/me')
  },
}
