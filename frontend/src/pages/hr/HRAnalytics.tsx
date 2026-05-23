import { Navigate } from "react-router-dom";

// Merged with the HR Dashboard — analytics now lives on /hr.
export default function HRAnalyticsPage() {
  return <Navigate to="/hr" replace />;
}
