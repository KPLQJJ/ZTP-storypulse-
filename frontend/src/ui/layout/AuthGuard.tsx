import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/infrastructure/stores/auth-store'

export function AuthGuard() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
