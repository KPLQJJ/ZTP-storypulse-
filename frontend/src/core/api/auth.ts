import type { RegisterRequest, LoginRequest, TokenResponse, UserOut } from './types'

export interface IAuthApi {
  register(req: RegisterRequest): Promise<TokenResponse>
  login(req: LoginRequest): Promise<TokenResponse>
  me(): Promise<UserOut>
}
