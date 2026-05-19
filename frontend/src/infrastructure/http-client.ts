import { useAuthStore } from './stores/auth-store'
import { useToastStore } from './stores/toast-store'

const BASE_URL = '/api'

export class HttpError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'HttpError'
    this.status = status
    this.detail = detail
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    })
  } catch {
    useToastStore.getState().addToast('error', '网络连接失败，请检查网络后重试')
    throw new HttpError(0, '网络连接失败')
  }

  if (res.status === 204) {
    return undefined as T
  }

  // Handle non-JSON responses gracefully
  let data: { detail?: string }
  try {
    data = await res.json()
  } catch {
    if (!res.ok) {
      useToastStore.getState().addToast('error', `服务器错误 (${res.status})`)
      throw new HttpError(res.status, `请求失败 (${res.status})`)
    }
    return undefined as T
  }

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout()
      useToastStore.getState().addToast('info', '登录已过期，请重新登录')
    } else if (res.status === 403) {
      useAuthStore.getState().logout()
      useToastStore.getState().addToast('error', '权限不足，请重新登录')
    } else {
      useToastStore.getState().addToast('error', data.detail || '请求失败')
    }
    throw new HttpError(res.status, data.detail || '请求失败')
  }

  return data as T
}

export const http = {
  get<T>(path: string): Promise<T> {
    return request<T>(path)
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(path: string): Promise<void> {
    return request<void>(path, { method: 'DELETE' })
  },

  upload<T>(path: string, file: File): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)
    return request<T>(path, {
      method: 'POST',
      body: formData,
    })
  },

  uploadMultiple<T>(path: string, files: File[]): Promise<T> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return request<T>(path, {
      method: 'POST',
      body: formData,
    })
  },
}
