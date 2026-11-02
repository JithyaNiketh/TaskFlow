import "./Sidebar.css";

import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Workflow,
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Projects", path: "/projects", icon: FolderKanban },
  { name: "My Tasks", path: "/tasks", icon: CheckSquare },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const name = user?.name || "User";
  const email = user?.email || "";
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Workflow size={22} />
        </div>
        <a href="/">
          <span>TaskFlow</span>
        </a>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>

      <nav className="sidebar-nav">
        {navigation.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" ref={profileRef}>
        <button
          type="button"
          className="sidebar-profile-trigger"
          onClick={() => setProfileOpen((open) => !open)}
          aria-expanded={profileOpen}
          aria-haspopup="true"
          aria-label="Open account menu"
        >
          <div className="user-avatar">{initials}</div>

          <div className="user-info">
            <span className="user-name">{name}</span>
          </div>

          <ChevronDown
            size={16}
            className={`profile-chevron ${profileOpen ? "open" : ""}`}
          />
        </button>

        {profileOpen && (
          <div className="profile-menu">
            <div className="profile-menu-header">
              <div className="profile-menu-avatar">{initials}</div>
              <div className="profile-menu-details">
                <span className="profile-menu-name">{name}</span>
                <span className="profile-menu-email">{email}</span>
              </div>
            </div>

            <div className="profile-menu-divider" />

            <button
              type="button"
              className="profile-menu-item"
              onClick={() => {
                setProfileOpen(false);
                navigate("/account");
              }}
            >
              <UserRound size={16} />
              <span>Account details</span>
            </button>

            <button
              type="button"
              className="profile-menu-item profile-menu-logout"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;