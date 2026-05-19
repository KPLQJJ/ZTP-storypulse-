import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/ui/layout/AppLayout'
import { AuthGuard } from '@/ui/layout/AuthGuard'
import { AdminGuard } from '@/ui/layout/AdminGuard'
import { AppProviders } from './providers'

// Lazy-loaded page placeholders (replaced by real pages as we build features)
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const NovelListPage = lazy(() => import('@/features/novels/pages/NovelListPage'))
const NovelCreatePage = lazy(() => import('@/features/novels/pages/NovelCreatePage'))
const NovelDetailPage = lazy(() => import('@/features/novels/pages/NovelDetailPage'))
const ReviewNewPage = lazy(() => import('@/features/reviews/pages/ReviewNewPage'))
const ReviewDetailPage = lazy(() => import('@/features/reviews/pages/ReviewDetailPage'))
const ReviewListPage = lazy(() => import('@/features/reviews/pages/ReviewListPage'))
const CreditsPage = lazy(() => import('@/features/credits/pages/CreditsPage'))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))
const AiModelsAdminPage = lazy(() => import('@/features/ai-models/pages/AiModelsAdminPage'))

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full" />
    </div>
  )
}

export function AppRouter() {
  return (
    <AppProviders>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/novels" replace />} />

              {/* Novels */}
              <Route path="/novels" element={<NovelListPage />} />
              <Route path="/novels/new" element={<NovelCreatePage />} />
              <Route path="/novels/:id" element={<NovelDetailPage />} />

              {/* Reviews */}
              <Route path="/reviews" element={<ReviewListPage />} />
              <Route path="/reviews/new" element={<ReviewNewPage />} />
              <Route path="/reviews/:id" element={<ReviewDetailPage />} />

              {/* Credits */}
              <Route path="/credits" element={<CreditsPage />} />
              <Route path="/credits/recharge" element={<CreditsPage />} />
              <Route path="/credits/transactions" element={<CreditsPage />} />

              {/* Profile */}
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin routes */}
            <Route element={<AdminGuard />}>
              <Route element={<AppLayout />}>
                <Route path="/admin/ai-models" element={<AiModelsAdminPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </AppProviders>
  )
}
