import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/context/AuthContext";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";
import OfflineIndicator from "@/react-app/components/OfflineIndicator";
import NativeWrapper from "@/react-app/components/NativeWrapper";

// Lazy load pages for faster initial load
const HomePage = lazy(() => import("@/react-app/pages/Home"));
const Register = lazy(() => import("@/react-app/pages/Register"));
const AuthCallback = lazy(() => import("@/react-app/pages/AuthCallback"));
const Dashboard = lazy(() => import("@/react-app/pages/Dashboard"));
const Groups = lazy(() => import("@/react-app/pages/Groups"));
const NewGroup = lazy(() => import("@/react-app/pages/NewGroup"));
const GroupDetail = lazy(() => import("@/react-app/pages/GroupDetail"));
const Expenses = lazy(() => import("@/react-app/pages/Expenses"));
const NewExpense = lazy(() => import("@/react-app/pages/NewExpense"));
const Profile = lazy(() => import("@/react-app/pages/Profile"));
const DonBarriga = lazy(() => import("@/react-app/pages/DonBarriga"));
const Logros = lazy(() => import("@/react-app/pages/Logros"));

// Loading spinner component
function PageLoader() {
  return (
    <div className="min-h-screen bg-onyx flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-iridescent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <NativeWrapper>
          <OfflineIndicator />
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <Groups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/new"
              element={
                <ProtectedRoute>
                  <NewGroup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <ProtectedRoute>
                  <GroupDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses/new"
              element={
                <ProtectedRoute>
                  <NewExpense />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/don-barriga"
              element={
                <ProtectedRoute>
                  <DonBarriga />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logros"
              element={
                <ProtectedRoute>
                  <Logros />
                </ProtectedRoute>
              }
            />
            </Routes>
          </Suspense>
        </NativeWrapper>
      </Router>
    </AuthProvider>
  );
}
