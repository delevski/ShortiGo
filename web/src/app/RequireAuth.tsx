import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LoadingView } from "../components/LoadingView";
import { ErrorView } from "../components/ErrorView";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authUser, configReady, error, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingView title="Opening your ShortiGo feed" />;
  }

  if (!configReady) {
    return (
      <ErrorView
        title="Firebase is not configured"
        message="Add the web Firebase environment values to enable account features."
      />
    );
  }

  if (error) {
    return <ErrorView title="Account sync failed" message={error.message} />;
  }

  if (!authUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
