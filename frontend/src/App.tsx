import { Routes, Route, Navigate } from "react-router-dom";
import { useLearner } from "./store/useLearner";
import { useAuth } from "./store/useAuth";
import { AppShell } from "./components/shell";
import { Landing } from "./pages/Landing";
import { Onboarding } from "./pages/Onboarding";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { SkillGap } from "./pages/SkillGap";
import { Recommendations } from "./pages/Recommendations";
import { LearningPathPage } from "./pages/LearningPath";
import { StepDetail } from "./pages/StepDetail";
import { Progress } from "./pages/Progress";
import { Simulation } from "./pages/Simulation";
import { Mentor } from "./pages/Mentor";
import { Profile } from "./pages/Profile";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireLearner({ children }: { children: React.ReactNode }) {
  const { learnerId } = useLearner();
  if (!learnerId) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <Onboarding />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <RequireLearner>
              <AppShell />
            </RequireLearner>
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/skill-gap" element={<SkillGap />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/path" element={<LearningPathPage />} />
        <Route path="/path/:pathId/step/:stepId" element={<StepDetail />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/mentor" element={<Mentor />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
