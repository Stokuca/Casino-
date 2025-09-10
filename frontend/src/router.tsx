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
  const role = useSelector((s: any) => s.auth.role);
  return <Navigate to={role === "operator" ? "/operator" : "/player"} replace />;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/app" element={<RoleHome />} />

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

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
