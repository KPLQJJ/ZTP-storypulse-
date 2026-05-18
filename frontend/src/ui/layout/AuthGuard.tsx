import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/infrastructure/stores/auth-store'

export function AuthGuard() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
