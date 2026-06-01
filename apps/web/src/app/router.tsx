import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { CompanyCandidatesPage } from "../pages/CompanyCandidatesPage";
import { CompanyJobsPage } from "../pages/CompanyJobsPage";
import { CompanyProfilePage } from "../pages/CompanyProfilePage";
import { CompleteCompanyProfilePage } from "../pages/CompleteCompanyProfilePage";
import { CompleteStudentProfilePage } from "../pages/CompleteStudentProfilePage";
import { DashboardPage } from "../pages/DashboardPage";
import { FeedPage } from "../pages/FeedPage";
import { HomePage } from "../pages/HomePage";
import { JobsPage } from "../pages/JobsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { StudentApplicationsPage } from "../pages/StudentApplicationsPage";
import { StudentProfilePage } from "../pages/StudentProfilePage";
import { StudentsPage } from "../pages/StudentsPage";
import { ProtectedRoute } from "../routes/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  {
    element: <AppShell />,
    children: [
      { path: "feed", element: <FeedPage /> },
      { path: "vagas", element: <JobsPage /> },
      { path: "alunos", element: <StudentsPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "perfil/aluno", element: <StudentProfilePage /> },
          { path: "perfil/aluno/candidaturas", element: <StudentApplicationsPage /> },
          { path: "perfil/empresa", element: <CompanyProfilePage /> },
          { path: "empresa/candidatos", element: <CompanyCandidatesPage /> },
          { path: "empresa/vagas", element: <CompanyJobsPage /> },
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
