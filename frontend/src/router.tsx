// src/router.tsx
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import RoleRoute from "./components/RoleRoute";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const PlayerDashboard = lazy(() => import("./pages/Player/Dashboard"));
const PlayerTransactions = lazy(() => import("./pages/Player/Transactions"));
const OperatorDashboard = lazy(() => import("./pages/Operator/Dashboard"));
const OperatorPlayers = lazy(() => import("./pages/Operator/Players"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RoleHome() {
  // tip: ako imaš RootState, zameni any sa RootState
  const role = useSelector((s: any) => s.auth.role);
  return <Navigate to={role === "operator" ? "/operator" : "/player"} replace />;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected + layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Centralizovan ulaz za ulogovane — vodi na player/operator */}
            <Route path="/app" element={<RoleHome />} />

            {/* Player */}
            <Route
              path="/player"
              element={
                <RoleRoute allow="player">
                  <PlayerDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/player/transactions"
              element={
                <RoleRoute allow="player">
                  <PlayerTransactions />
                </RoleRoute>
              }
            />

            {/* Operator */}
            <Route
              path="/operator"
              element={
                <RoleRoute allow="operator">
                  <OperatorDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/operator/players"
              element={
                <RoleRoute allow="operator">
                  <OperatorPlayers />
                </RoleRoute>
              }
            />

            {/* 404 u okviru layout-a */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
