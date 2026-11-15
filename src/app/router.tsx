import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Core Auth & User Shell (eager for fast initial paint)
import { UserLayout } from '@/components/layout/UserLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { TrustPage } from '@/pages/trust/TrustPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteLoader, RootDocumentMetaLayout } from './RouteShells';

// Guards
import { ProtectedRoute, AdminRoute, GuestRoute } from './guards';

// Lazy-loaded FoodLens Page
const FoodLensPage = lazy(() =>
  import('@/pages/foodlens/FoodLensPage').then((m) => ({ default: m.FoodLensPage }))
);

// Lazy-loaded Admin Layout & Pages (isolates Recharts & Admin bundle from regular users)
const AdminLayout = lazy(() =>
  import('@/components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminOverviewPage = lazy(() =>
  import('@/pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage }))
);
const CostsQuotasPage = lazy(() =>
  import('@/pages/admin/CostsQuotasPage').then((m) => ({ default: m.CostsQuotasPage }))
);
const UserManagementPage = lazy(() =>
  import('@/pages/admin/UserManagementPage').then((m) => ({ default: m.UserManagementPage }))
);
const AuditLogsPage = lazy(() =>
  import('@/pages/admin/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage }))
);

// Dev-only Styleguide (never shipped or exposed in production routes)
const StyleguidePage = import.meta.env.DEV
  ? lazy(() => import('@/pages/dev/StyleguidePage').then((m) => ({ default: m.StyleguidePage })))
  : null;

function withSuspense(node: React.ReactNode): React.ReactElement {
  return <Suspense fallback={<RouteLoader />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <RootDocumentMetaLayout />,
    children: [
      // Auth Routes
      {
        element: (
          <GuestRoute>
            <AuthLayout />
          </GuestRoute>
        ),
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },

      // Dev Styleguide Route (Strictly restricted to local DEV environment)
      ...(import.meta.env.DEV && StyleguidePage
        ? [
            {
              path: '/dev/styleguide',
              element: withSuspense(<StyleguidePage />),
            },
          ]
        : []),

      // User App Protected Routes
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        ),
        children: [
          // FoodLens là trang chủ duy nhất của vai người dùng
          { index: true, element: <Navigate to="/foodlens" replace /> },
          { path: 'foodlens', element: withSuspense(<FoodLensPage />) },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'trust', element: <TrustPage /> },
        ],
      },

      // Admin App Protected Routes (Lazy-loaded)
      {
        path: '/admin',
        element: (
          <AdminRoute>
            {withSuspense(<AdminLayout />)}
          </AdminRoute>
        ),
        children: [
          { index: true, element: withSuspense(<AdminOverviewPage />) },
          { path: 'overview', element: <Navigate to="/admin" replace /> },
          { path: 'costs', element: withSuspense(<CostsQuotasPage />) },
          { path: 'users', element: withSuspense(<UserManagementPage />) },
          { path: 'audit', element: withSuspense(<AuditLogsPage />) },
        ],
      },

      // 404 Catch All
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
