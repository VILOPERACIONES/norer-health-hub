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
import Pending from "@/pages/Pending";
import Settings from "@/pages/Settings";
import EquivalenciasSMAE from "@/pages/EquivalenciasSMAE";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Protector de rutas por permiso granular
const PermissionGuard = ({ module, children }: { module: string, children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  const isAdmin = user.rol === 'admin' || (user as any).role === 'admin';
  const hasPerm = isAdmin || user.permisos?.[module]?.read !== false;
  
  if (!hasPerm) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();

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

  // Decidir a dónde mandar al usuario al entrar a la raíz /
  const getDefaultRoute = () => {
    if (!user) return "/login";
    const isAdmin = user.rol === 'admin' || (user as any).role === 'admin';
    if (isAdmin || user.permisos?.dashboard?.read !== false) return "/dashboard";
    if (user.permisos?.pacientes?.read !== false) return "/pacientes";
    if (user.permisos?.planes?.read !== false) return "/planes";
    if (user.permisos?.smae?.read !== false) return "/equivalencias";
    return "/configuracion";
  };

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
              <Route index element={<Navigate to={getDefaultRoute()} replace />} />
              
              <Route path="dashboard" element={<PermissionGuard module="dashboard"><Dashboard /></PermissionGuard>} />
              
              {/* Rutas de Pacientes */}
              <Route path="pacientes" element={<PermissionGuard module="pacientes"><Patients /></PermissionGuard>} />
              <Route path="pacientes/nuevo" element={<PermissionGuard module="pacientes"><NewPatient /></PermissionGuard>} />
              <Route path="pacientes/:id/editar" element={<PermissionGuard module="pacientes"><EditPatient /></PermissionGuard>} />
              <Route path="pacientes/:id" element={<PermissionGuard module="pacientes"><PatientProfile /></PermissionGuard>} />
              <Route path="pacientes/:id/valoracion/nueva" element={<PermissionGuard module="pacientes"><NewAssessment /></PermissionGuard>} />
              <Route path="pacientes/:id/valoraciones/:valoracionId" element={<PermissionGuard module="pacientes"><AssessmentDetail /></PermissionGuard>} />
              <Route path="pacientes/:id/requerimientos" element={<PermissionGuard module="pacientes"><Requirements /></PermissionGuard>} />
              <Route path="pacientes/:id/planes/nuevo" element={<PermissionGuard module="pacientes"><CreateEditPlan /></PermissionGuard>} />
              <Route path="pacientes/:id/planes/:planId" element={<PermissionGuard module="pacientes"><PlanView /></PermissionGuard>} />
              <Route path="pacientes/:id/planes/:planId/editar" element={<PermissionGuard module="pacientes"><CreateEditPlan /></PermissionGuard>} />
              
              {/* Rutas de Planes */}
              <Route path="planes" element={<PermissionGuard module="planes"><Plans /></PermissionGuard>} />
              <Route path="pendientes" element={<PermissionGuard module="planes"><Pending /></PermissionGuard>} />
              <Route path="planes/nuevo" element={<PermissionGuard module="planes"><CreateEditPlan /></PermissionGuard>} />
              <Route path="planes/:planId/editar" element={<PermissionGuard module="planes"><CreateEditPlan /></PermissionGuard>} />
              
              <Route path="configuracion" element={<Settings />} />
              <Route path="equivalencias" element={<PermissionGuard module="smae"><EquivalenciasSMAE /></PermissionGuard>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
