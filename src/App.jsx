
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./Components/Auth/ProtectedRoute";

import Layout from "./Components/Layout/Layout";
import AuthPage from "./Components/Auth/AuthPage";
import DashBoard from "./Pages/Dashboard/DashBoard";
import Projects from "./Pages/Projects/Projects";
import ProjectsBoard from "./Pages/ProjectsBoard/ProjectsBoard";
import Tasks from "./Pages/Tasks/Tasks";
import Account from "./Pages/Account/Account";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public authentication page */}
          <Route path="/login" element={<AuthPage />} />

          {/* Everything inside this route requires authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashBoard />} />
              <Route path="projects" element={<Projects />} />
              <Route
                path="projects/:projectId"
                element={<ProjectsBoard />}
              />
              <Route path="tasks" element={<Tasks />} />
              <Route path="account" element={<Account />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
