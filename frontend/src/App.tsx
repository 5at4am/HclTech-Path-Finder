import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import ProfileSetup from "./pages/ProfileSetup";
import Analyzing from "./pages/Analyzing";
import Path from "./pages/Path";
import Dashboard from "./pages/Dashboard";
import Skills from "./pages/Skills";
import Courses from "./pages/Courses";
import Projects from "./pages/Projects";
import Mentor from "./pages/Mentor";
import AppShell from "./components/AppShell";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/profile" element={<ProfileSetup />} />
      <Route path="/analyzing" element={<Analyzing />} />
      <Route path="/path" element={<Path />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/mentor" element={<Mentor />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
