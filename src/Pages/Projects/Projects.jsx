
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../server/src/lib/api";
import ConfirmationModal from "../../Components/UI/ConfirmationModal/ConfirmationModal";
import CustomSelect from "../../Components/UI/CustomSelect/CustomSelect";
import CustomDatePicker from "../../Components/UI/CustomDatePicker/CustomDatePicker"
import "./Projects.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  dueDate: "",
  status: "active",
};

function getTodayISO() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

const STATUS_LABELS = {
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

function formatDate(date) {
  if (!date) return null;

  // Avoid timezone shifts for PostgreSQL DATE values.
  const [year, month, day] = date.slice(0, 10).split("-");
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProjectFormModal({
  project,
  onClose,
  onSave,
  saving,
  error,
}) {
  const [dateValidationError, setDateValidationError] = useState("");
  const [form, setForm] = useState(() =>
    project
      ? {
          name: project.name,
          description: project.description || "",
          dueDate: project.dueDate
            ? project.dueDate.slice(0, 10)
            : "",
          status: project.status,
        }
      : EMPTY_FORM
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();

    if (form.dueDate && form.dueDate < getTodayISO()) {
      setDateValidationError("Due date cannot be in the past.");
      return;
    }
    setDateValidationError("");

    onSave({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate || null,
    });
  }

  return (
    <div
      className="projects-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="projects-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
      >
        <div className="projects-modal-heading">
          <div>
            <p className="projects-eyebrow">
              {project ? "PROJECT SETTINGS" : "NEW WORKSPACE"}
            </p>
            <h2 id="project-modal-title">
              {project ? "Edit project" : "Create a project"}
            </h2>
          </div>

          <button
            className="projects-icon-button"
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="projects-form">
          <label>
            <span className="projects-field-label">
              Project name <span className="projects-required">*</span>
            </span>
            <input
              autoFocus
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="e.g. Website redesign"
              maxLength={120}
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="What is this project about?"
              rows={4}
              maxLength={10000}
            />
          </label>

          <div className="projects-form-row">
          <label>
            Due date
            <CustomDatePicker
              value={form.dueDate}
              onChange={(date) => {
                setDateValidationError("");
                setForm((current) => ({ ...current, dueDate: date }));
              }}
            />
            {dateValidationError && (
              <span className="projects-form-error" role="alert">
                {dateValidationError}
              </span>
            )}
          </label>


            {project && (
              <label>
                Status
                <CustomSelect
                  ariaLabel="Filter projects by status"
                  value={form.status}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, status: value }))
                  }
                  options={[
                    { value: "active", label: "Active" },
                    { value: "on_hold", label: "On hold" },
                    { value: "completed", label: "Completed" },
                  ]}
                />
              </label>
            )}
          </div>

          {error && (
            <p className="projects-form-error" role="alert">
              {error}
            </p>
          )}

          <div className="projects-modal-actions">
            <button
              type="button"
              className="projects-button projects-button-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="projects-button projects-button-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : project
                  ? "Save changes"
                  : "Create project"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProjectCard({ project, view, onEdit, onDelete }) {
  return (
    <article className={`project-card ${view === "list" ? "project-card-list" : ""}`}>
      <div className="project-card-top">
        <div className="project-card-symbol" aria-hidden="true">
          {project.name.trim().charAt(0).toUpperCase()}
        </div>

        <button
          type="button"
          className="projects-icon-button project-card-menu"
          onClick={() => onEdit(project)}
          aria-label={`Edit ${project.name}`}
          title="Edit project"
        >
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
          </svg>
        </button>
      </div>

      <div className="project-card-content">
        <div className="project-card-title-row">
          <h3>{project.name}</h3>
          <span className={`project-status status-${project.status}`}>
            <span className="project-status-dot" />
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        <p className="project-card-description">
          {project.description || "No description added yet."}
        </p>

        <div className="project-card-meta">
          <span>
            <span aria-hidden="true">◷</span>{" "}
            {project.dueDate
              ? `Due ${formatDate(project.dueDate)}`
              : "No due date"}
          </span>
          <span>
            Created {formatDate(project.createdAt)}
          </span>
        </div>
      </div>

      <div className="project-card-actions">
        <Link
          to={`/projects/${project.id}`}
          className="projects-button projects-button-primary project-open-button"
        >
          Open board <span aria-hidden="true">↗</span>
        </Link>

        <button
          type="button"
          className="projects-button projects-button-danger"
          onClick={() => onDelete(project)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [modalProject, setModalProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const data = await apiRequest("/projects");
      setProjects(data.projects || []);
    } catch (error) {
      setPageError(error.message || "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.name.toLowerCase().includes(query) ||
        (project.description || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const counts = useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((p) => p.status === "active").length,
      on_hold: projects.filter((p) => p.status === "on_hold").length,
      completed: projects.filter((p) => p.status === "completed").length,
    }),
    [projects]
  );

  function openCreateModal() {
    setModalProject(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(project) {
    setModalProject(project);
    setFormError("");
    setModalOpen(true);
  }

  async function saveProject(form) {
    setSaving(true);
    setFormError("");

    try {
      const data = modalProject
        ? await apiRequest(`/projects/${modalProject.id}`, {
            method: "PATCH",
            body: JSON.stringify(form),
          })
        : await apiRequest("/projects", {
            method: "POST",
            body: JSON.stringify({
              name: form.name,
              description: form.description,
              dueDate: form.dueDate,
            }),
          });

      if (modalProject) {
        setProjects((current) =>
          current.map((project) =>
            project.id === data.project.id ? data.project : project
          )
        );
      } else {
        setProjects((current) => [data.project, ...current]);
      }

      setModalOpen(false);
      setModalProject(null);
    } catch (error) {
      setFormError(error.message || "Could not save the project.");
    } finally {
      setSaving(false);
    }
  }

  function deleteProject(project) {
    setProjectToDelete(project);
  }

  async function confirmDeleteProject() {
    if (!projectToDelete) return;

    const project = projectToDelete;
    setDeletingId(project.id);
    setPageError("");

    try {
      await apiRequest(`/projects/${project.id}`, {
        method: "DELETE",
      });

      setProjects((current) =>
        current.filter((item) => item.id !== project.id)
      );
      setProjectToDelete(null);
    } catch (error) {
      setPageError(error.message || "Could not delete the project.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="projects-page">
      <header className="projects-page-header">
        <div>
          <p className="projects-eyebrow">YOUR WORKSPACE</p>
          <h1>Projects<span>.</span></h1>
          <p className="projects-page-subtitle">
            Organize your work and keep everything moving.
          </p>
        </div>

        <button
          type="button"
          className="projects-button projects-button-primary projects-create-button"
          onClick={openCreateModal}
        >
          <span aria-hidden="true">＋</span> New project
        </button>
      </header>

      <div className="projects-summary">
        <div>
          <span className="projects-summary-label">Total projects</span>
          <strong>{counts.all.toString().padStart(2, "0")}</strong>
        </div>
        <div>
          <span className="projects-summary-label">Active</span>
          <strong>{counts.active.toString().padStart(2, "0")}</strong>
        </div>
        <div>
          <span className="projects-summary-label">On hold</span>
          <strong>{counts.on_hold.toString().padStart(2, "0")}</strong>
        </div>
        <div>
          <span className="projects-summary-label">Completed</span>
          <strong>{counts.completed.toString().padStart(2, "0")}</strong>
        </div>
      </div>

      <div className="projects-toolbar">
        <div className="projects-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search projects..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              className="projects-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="projects-toolbar-right">
          <label className="projects-filter">
            <span className="projects-filter-label">Status</span>
            <CustomSelect
              ariaLabel="Filter projects by status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All projects" },
                { value: "active", label: "Active" },
                { value: "on_hold", label: "On hold" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </label>

          <div className="projects-view-toggle" aria-label="Project view">
            <button
              type="button"
              className={view === "grid" ? "selected" : ""}
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              title="Grid view"
            >
              ▦
            </button>
            <button
              type="button"
              className={view === "list" ? "selected" : ""}
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="projects-page-error" role="alert">
          <span>{pageError}</span>
          <button type="button" onClick={loadProjects}>
            Try again
          </button>
        </div>
      )}

      <div className="projects-results-heading">
        <h2>
          {statusFilter === "all"
            ? "All projects"
            : STATUS_LABELS[statusFilter]}
        </h2>
        <span>
          {filteredProjects.length}{" "}
          {filteredProjects.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {loading ? (
        <div className="projects-state">
          <span className="projects-loader" />
          <p>Loading your projects...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className={`projects-collection projects-collection-${view}`}>
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className={
                deletingId === project.id ? "project-card-deleting" : ""
              }
            >
              <ProjectCard
                project={project}
                view={view}
                onEdit={openEditModal}
                onDelete={deleteProject}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="projects-empty">
          <div className="projects-empty-symbol" aria-hidden="true">↗</div>
          <h3>
            {search || statusFilter !== "all"
              ? "No matching projects"
              : "Start with your first project"}
          </h3>
          <p>
            {search || statusFilter !== "all"
              ? "Try another search term or change your status filter."
              : "Create a project to organize tasks and track your progress."}
          </p>

          {search || statusFilter !== "all" ? (
            <button
              type="button"
              className="projects-button projects-button-secondary"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          ) : (
            <button
              type="button"
              className="projects-button projects-button-primary"
              onClick={openCreateModal}
            >
              ＋ Create your first project
            </button>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(projectToDelete)}
        title="Delete project?"
        message={projectToDelete
          ? `Are you sure you want to delete “${projectToDelete.name}”? This will permanently delete the project and its associated tasks. This action cannot be undone.`
          : ""}
        confirmText="Delete project"
        cancelText="Keep project"
        variant="danger"
        loading={Boolean(projectToDelete && deletingId === projectToDelete.id)}
        onCancel={() => {
          if (!deletingId) setProjectToDelete(null);
        }}
        onConfirm={confirmDeleteProject}
      />

      {modalOpen && (
        <ProjectFormModal
          key={modalProject?.id || "new-project"}
          project={modalProject}
          onClose={() => {
            setModalOpen(false);
            setFormError("");
          }}
          onSave={saveProject}
          saving={saving}
          error={formError}
        />
      )}
    </section>
  );
}
