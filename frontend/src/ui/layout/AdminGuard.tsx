import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/infrastructure/stores/auth-store'

export function AdminGuard() {
  const user = useAuthStore((s) => s.user)

  if (!user || user.role !== 'admin') {
    return <Navigate to="/novels" replace />
  }

  return <Outlet />
}
