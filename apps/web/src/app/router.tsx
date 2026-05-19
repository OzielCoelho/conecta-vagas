import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { CompanyProfilePage } from "../pages/CompanyProfilePage";
import { CompanyCandidatesPage } from "../pages/CompanyCandidatesPage";
import { CompleteCompanyProfilePage } from "../pages/CompleteCompanyProfilePage";
import { CompleteStudentProfilePage } from "../pages/CompleteStudentProfilePage";
import { DashboardPage } from "../pages/DashboardPage";
import { JobsPage } from "../pages/JobsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { StudentApplicationsPage } from "../pages/StudentApplicationsPage";
import { StudentProfilePage } from "../pages/StudentProfilePage";
import { StudentsPage } from "../pages/StudentsPage";
import { ProtectedRoute } from "../routes/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "vagas", element: <JobsPage /> },
      { path: "alunos", element: <StudentsPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "perfil/aluno", element: <StudentProfilePage /> },
          { path: "perfil/aluno/candidaturas", element: <StudentApplicationsPage /> },
          { path: "perfil/empresa", element: <CompanyProfilePage /> },
          { path: "empresa/candidatos", element: <CompanyCandidatesPage /> },
          { path: "configuracoes", element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/completar-perfil/aluno", element: <CompleteStudentProfilePage /> },
      { path: "/completar-perfil/empresa", element: <CompleteCompanyProfilePage /> },
    ],
  },
  { path: "/login", element: <Navigate to="/?auth=login" replace /> },
  { path: "/cadastro", element: <Navigate to="/?auth=register" replace /> },
]);
