import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/ui/layout/AppLayout'
import { AuthGuard } from '@/ui/layout/AuthGuard'
import { AdminGuard } from '@/ui/layout/AdminGuard'
import { AppProviders } from './providers'

// Auth
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))

// Workspace
const WorkspacePage = lazy(() => import('@/features/workspace/pages/WorkspacePage'))
const NovelDashboardPage = lazy(() => import('@/features/workspace/pages/NovelDashboardPage'))

// Hub pages
const WriteHubPage = lazy(() => import('@/features/workspace/pages/WriteHubPage'))
const PolishHubPage = lazy(() => import('@/features/workspace/pages/PolishHubPage'))
const ReviewHubPage = lazy(() => import('@/features/workspace/pages/ReviewHubPage'))

// Detail pages
const WritePage = lazy(() => import('@/features/workspace/pages/WritePage'))
const PolishPage = lazy(() => import('@/features/workshop/pages/PolishPage'))
const ReviewNewPage = lazy(() => import('@/features/reviews/pages/ReviewNewPage'))
const ReviewDetailPage = lazy(() => import('@/features/reviews/pages/ReviewDetailPage'))

// Credits & Profile
const CreditsPage = lazy(() => import('@/features/credits/pages/CreditsPage'))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))

// Admin
const AiModelsAdminPage = lazy(() => import('@/features/ai-models/pages/AiModelsAdminPage'))
const ApiProvidersAdminPage = lazy(() => import('@/features/api-providers/pages/ApiProvidersAdminPage'))

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
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/workspace" replace />} />

              {/* Workspace */}
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/workspace/novel/:id" element={<NovelDashboardPage />} />
              <Route path="/workspace/novel/:id/write" element={<WritePage />} />
              <Route path="/workspace/novel/:id/polish" element={<PolishPage />} />
              <Route path="/workspace/novel/:id/review" element={<ReviewNewPage />} />

              {/* Hub — standalone entry points */}
              <Route path="/write" element={<WriteHubPage />} />
              <Route path="/write/novel/:id" element={<WritePage />} />
              <Route path="/polish" element={<PolishHubPage />} />
              <Route path="/polish/novel/:id" element={<PolishPage />} />
              <Route path="/review" element={<ReviewHubPage />} />
              <Route path="/review/novel/:id" element={<ReviewNewPage />} />
              <Route path="/reviews/:id" element={<ReviewDetailPage />} />

              {/* Credits */}
              <Route path="/credits" element={<CreditsPage />} />
              <Route path="/credits/recharge" element={<CreditsPage />} />
              <Route path="/credits/transactions" element={<CreditsPage />} />

              {/* Profile */}
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin */}
            <Route element={<AdminGuard />}>
              <Route element={<AppLayout />}>
                <Route path="/admin/ai-models" element={<AiModelsAdminPage />} />
                <Route path="/admin/api-providers" element={<ApiProvidersAdminPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </AppProviders>
  )
}
