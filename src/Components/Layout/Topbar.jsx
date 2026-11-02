import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";

const pageTitles = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/tasks": "My Tasks",
  "/account": "Account Details"
};

function Topbar() {
  const location = useLocation();

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/projects/")
      ? "Project Board"
      : "TaskFlow");

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="breadcrumb-muted">Workspace</span>
        <span className="breadcrumb-separator">/</span>
        <span>{title}</span>
      </div>
    </header>
  );
}

export default Topbar;