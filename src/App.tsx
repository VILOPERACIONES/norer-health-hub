import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import NewPatient from "@/pages/NewPatient";
import PatientProfile from "@/pages/PatientProfile";
import EditPatient from "@/pages/EditPatient";
import NewAssessment from "@/pages/NewAssessment";
import AssessmentDetail from "@/pages/AssessmentDetail";
import CreateEditPlan from "@/pages/CreateEditPlan";
import PlanView from "@/pages/PlanView";
import Requirements from "@/pages/Requirements";
import Plans from "@/pages/Plans";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pacientes" element={<Patients />} />
              <Route path="pacientes/nuevo" element={<NewPatient />} />
              <Route path="pacientes/:id/editar" element={<EditPatient />} />
              <Route path="pacientes/:id" element={<PatientProfile />} />
              <Route path="pacientes/:id/valoracion/nueva" element={<NewAssessment />} />
              <Route path="pacientes/:id/valoraciones/:valoracionId" element={<AssessmentDetail />} />
              <Route path="pacientes/:id/requerimientos" element={<Requirements />} />
              <Route path="pacientes/:id/planes/nuevo" element={<CreateEditPlan />} />
              <Route path="pacientes/:id/planes/:planId" element={<PlanView />} />
              <Route path="pacientes/:id/planes/:planId/editar" element={<CreateEditPlan />} />
              <Route path="planes" element={<Plans />} />
              <Route path="configuracion" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
