import api from './axios'

export interface SignInRequest {
  username: string
  password: string
}

export interface SignUpRequest {
  username: string
  fio: string
  password: string
}

export interface AuthResponse {
  accessToken: string
}

export const authApi = {
  signIn: (data: SignInRequest) =>
    api.post<AuthResponse>('/auth/signIn', data).then((r) => r.data),

  signUp: (data: SignUpRequest) =>
    api.post<AuthResponse>('/auth/signUp', data).then((r) => r.data),
}
