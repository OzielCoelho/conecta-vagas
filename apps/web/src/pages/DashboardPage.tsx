import { useAuth } from "../auth/AuthProvider";
import { CompanyJobsPage } from "./CompanyJobsPage";
import { HomePage } from "./HomePage";
import { StudentDashboardPage } from "./StudentDashboardPage";

export function DashboardPage() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <HomePage />;
  }

  if (user.role === "COMPANY") {
    return <CompanyJobsPage />;
  }

  return <StudentDashboardPage />;
}
