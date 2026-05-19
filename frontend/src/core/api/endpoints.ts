export const ENDPOINTS = {
  AI_MODELS: {
    LIST: '/ai-models',
    ADMIN_LIST: '/admin/ai-models',
    ADMIN_CREATE: '/admin/ai-models',
    ADMIN_UPDATE: (id: number) => `/admin/ai-models/${id}`,
    ADMIN_TOGGLE: (id: number) => `/admin/ai-models/${id}/toggle`,
    ADMIN_DELETE: (id: number) => `/admin/ai-models/${id}`,
  },
}
