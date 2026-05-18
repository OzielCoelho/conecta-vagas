import { useAuth } from "../auth/AuthProvider";
import { CompanyCandidatesPage } from "./CompanyCandidatesPage";
import { HomePage } from "./HomePage";
import { StudentDashboardPage } from "./StudentDashboardPage";

export function DashboardPage() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <HomePage />;
  }

  if (user.role === "COMPANY") {
    return <CompanyCandidatesPage />;
  }

  return <StudentDashboardPage />;
}
