import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { initAccessFromRefresh } from "./lib/api";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute, { RequireAuth, RedirectIfAuthed } from "./routes/guards";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/Dashboard";
import Login from "./pages/Login";
import CandidateRegister from "./pages/candidates/Register";
import CandidateProfile from "./pages/candidates/Profile";
import SearchPage from "./pages/Search";
import ClientsPage from "./pages/clients/ClientsPage";
import NotFound from "./pages/NotFound";
import LoadingAppSkeleton from "./components/LaodingAppSkeleton";
import ClientDetailsPage from "./pages/clients/ClientDetailsPage";
import JobsPage from "./pages/JobsPage";
function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAccessFromRefresh().finally(() => setReady(true));
  }, []);

if (!ready) return <LoadingAppSkeleton />;

  return (
    <AuthProvider>
      <Routes>
        {/* Public: redirect to / if already authed */}
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />

        {/* Protected area */}
        <Route element={<RequireAuth />}>
          {/* Layout wraps all protected pages */}
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
             <Route
      path="clients"
      element={
        <ProtectedRoute>
          <ClientsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="clients/:id"
      element={
        <ProtectedRoute>
          <ClientDetailsPage />
        </ProtectedRoute>
      }
    /> 
    <Route path="jobs" element={<JobsPage />} ></Route>
            <Route path="candidates/register" element={<CandidateRegister />} />
            <Route path="candidates/:id" element={<CandidateProfile />} />
            <Route path="search" element={<SearchPage />} />
            {/* 404 inside layout, optional */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        {/* 404 outside layout (if you prefer) */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </AuthProvider>
  );
}

export default App;
