// src/router.tsx
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import RoleRoute from "./components/RoleRoute.tsx";

const Login = lazy(() => import("./pages/Login.tsx"));
const Register = lazy(() => import("./pages/Register.tsx"));
const PlayerDashboard = lazy(() => import("./pages/Player/Dashboard.tsx"));
const PlayerTransactions = lazy(() => import("./pages/Player/Transactions.tsx"));
const OperatorDashboard = lazy(() => import("./pages/Operator/Dashboard.tsx"));
const OperatorPlayers = lazy(() => import("./pages/Operator/Players.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));


export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* App (protected) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Player */}
            <Route
              path="/player"
              element={<RoleRoute allow="player"><PlayerDashboard /></RoleRoute>}
            />
            <Route
              path="/player/transactions"
              element={<RoleRoute allow="player"><PlayerTransactions /></RoleRoute>}
            />

            {/* Operator */}
            <Route
              path="/operator"
              element={<RoleRoute allow="operator"><OperatorDashboard /></RoleRoute>}
            />
            <Route
              path="/operator/players"
              element={<RoleRoute allow="operator"><OperatorPlayers /></RoleRoute>}
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
