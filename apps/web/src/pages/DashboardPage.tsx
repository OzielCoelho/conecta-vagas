import { useAuth } from "../auth/AuthProvider";
import { CompanyDashboardPage } from "./CompanyDashboardPage";
import { CoordinatorDashboardPage } from "./CoordinatorDashboardPage";
import { StudentDashboardPage } from "./StudentDashboardPage";

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "COMPANY") {
    return <CompanyDashboardPage />;
  }

  if (user?.role === "COORDINATOR") {
    return <CoordinatorDashboardPage />;
  }

  return <StudentDashboardPage />;
}
