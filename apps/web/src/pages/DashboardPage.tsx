import { useAuth } from "../auth/AuthProvider";
import { CompanyJobsPage } from "./CompanyJobsPage";
import { StudentDashboardPage } from "./StudentDashboardPage";

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "COMPANY") {
    return <CompanyJobsPage />;
  }

  return <StudentDashboardPage />;
}
