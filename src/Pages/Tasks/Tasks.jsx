import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../server/src/lib/api";
import CustomSelect from "../../Components/UI/CustomSelect/CustomSelect";
import CustomDatePicker from "../../Components/UI/CustomDatePicker/CustomDatePicker";
import "../../Components/UI/CustomDatePicker/CustomDatePicker.css";
import "./Tasks.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  projectId: "",
};

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUS_LABELS = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function formatDate(value) {
  if (!value) return "No due date";
  const iso = String(value).slice(0, 10);
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "No due date";
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProjectMultiSelect({ projects, selectedIds, onChange, includeIndependent, onIndependentChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function closeOnOutside(event) {
      if (!event.target.closest?.(".tasks-project-filter")) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const allSelected = selectedIds.length === 0 && includeIndependent;
  const selectedCount = selectedIds.length + (includeIndependent ? 1 : 0);

  function toggleProject(id) {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter((selected) => selected !== id)
      : [...selectedIds, id]);
  }

  function clearFilter() {
    onChange([]);
    onIndependentChange(true);
    setQuery("");
  }

  return (
    <div className="tasks-project-filter">
      <button
        type="button"
        className={`tasks-filter-trigger${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h16l-6.2 7.1v5.1l-3.6 1.8v-6.9L4 5Z" />
        </svg>
        <span>
          {selectedCount === 0 || allSelected
            ? "All projects"
            : `${selectedCount} selected`}
        </span>
        <span className="tasks-filter-chevron">⌄</span>
      </button>

      {open && (
        <div className="tasks-project-menu" role="dialog" aria-label="Filter tasks by project">
          <div className="tasks-project-menu-top">
            <strong>Filter by project</strong>
            <button type="button" onClick={clearFilter}>Clear</button>
          </div>
          <input
            className="tasks-project-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a project..."
            aria-label="Find a project"
          />
          <div className="tasks-project-options">
            <label className="tasks-check-option">
              <input
                type="checkbox"
                checked={includeIndependent}
                onChange={(event) => onIndependentChange(event.target.checked)}
              />
              <span className="tasks-check-box" />
              <span>Independent tasks</span>
            </label>
            {filteredProjects.map((project) => (
              <label className="tasks-check-option" key={project.id}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(project.id)}
                  onChange={() => toggleProject(project.id)}
                />
                <span className="tasks-check-box" />
                <span className="tasks-project-option-name">{project.name}</span>
              </label>
            ))}
            {filteredProjects.length === 0 && (
              <p className="tasks-project-empty">No matching projects.</p>
            )}
          </div>
          <div className="tasks-project-menu-bottom">
            <span>{selectedCount} filter option{selectedCount === 1 ? "" : "s"} selected</span>
            <button type="button" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskModal({ open, task, projects, saving, error, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(task ? {
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      priority: task.priority || "medium",
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : "",
      projectId: task.projectId || "",
    } : EMPTY_FORM);
  }, [open, task]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event) {
      if (event.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, saving, onClose]);

  if (!open) return null;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      projectId: form.projectId || null,
      dueDate: form.dueDate || null,
    });
  }

  const projectOptions = [
    { value: "", label: "Independent task (no project)" },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ];

  return (
    <div
      className="tasks-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section className="tasks-modal" role="dialog" aria-modal="true" aria-labelledby="tasks-modal-title">
        <header className="tasks-modal-header">
          <div>
            <p className="tasks-eyebrow">TASK DETAILS</p>
            <h2 id="tasks-modal-title">{task ? "Edit task" : "Create a task"}</h2>
          </div>
          <button type="button" className="tasks-modal-close" onClick={onClose} disabled={saving} aria-label="Close">×</button>
        </header>

        <form className="tasks-form" onSubmit={submit}>
          <label className="tasks-field">
            <span>Task title <b>*</b></span>
            <input
              autoFocus
              required
              maxLength={200}
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Prepare project presentation"
            />
          </label>

          <label className="tasks-field">
            <span>Description</span>
            <textarea
              rows={3}
              maxLength={3000}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Add details about this task..."
            />
          </label>

          <label className="tasks-field">
            <span>Project</span>
            <CustomSelect
              value={form.projectId}
              onChange={(value) => update("projectId", value)}
              ariaLabel="Assign task to a project"
              options={projectOptions}
            />
            <small>Leave this empty to keep the task independent.</small>
          </label>

          <div className="tasks-form-row">
            <label className="tasks-field">
              <span>Status</span>
              <CustomSelect
                value={form.status}
                onChange={(value) => update("status", value)}
                ariaLabel="Task status"
                options={STATUS_OPTIONS}
              />
            </label>
            <label className="tasks-field">
              <span>Priority</span>
              <CustomSelect
                value={form.priority}
                onChange={(value) => update("priority", value)}
                ariaLabel="Task priority"
                options={PRIORITY_OPTIONS}
              />
            </label>
          </div>

          <label className="tasks-field">
            <span>Due date</span>
            <CustomDatePicker
              value={form.dueDate}
              onChange={(value) => update("dueDate", value)}
            />
          </label>

          {error && <p className="tasks-form-error" role="alert">{error}</p>}

          <footer className="tasks-modal-footer">
            <button type="button" className="tasks-button secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="tasks-button primary" disabled={saving}>
              {saving ? "Saving..." : task ? "Save changes" : "Create task"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [modalError, setModalError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [includeIndependent, setIncludeIndependent] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const [taskData, projectData] = await Promise.all([
        apiRequest("/tasks"),
        apiRequest("/projects"),
      ]);
      setTasks(taskData.tasks || []);
      setProjects(projectData.projects || []);
    } catch (error) {
      setPageError(error.message || "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !query ||
        task.title.toLowerCase().includes(query) ||
        (task.description || "").toLowerCase().includes(query) ||
        (task.projectName || "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;

      let matchesProject = true;
      const hasProjectFilter = selectedProjectIds.length > 0 || !includeIndependent;
      if (hasProjectFilter) {
        matchesProject = task.projectId
          ? selectedProjectIds.includes(task.projectId)
          : includeIndependent;
      }
      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [tasks, search, statusFilter, selectedProjectIds, includeIndependent]);

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter((task) => task.status === "todo").length,
    in_progress: tasks.filter((task) => task.status === "in_progress").length,
    done: tasks.filter((task) => task.status === "done").length,
  }), [tasks]);

  function openCreate() {
    setEditingTask(null);
    setModalError("");
    setModalOpen(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setModalError("");
    setModalOpen(true);
  }

  async function saveTask(form) {
    setSaving(true);
    setModalError("");
    try {
      const data = editingTask
        ? await apiRequest(`/tasks/${editingTask.id}`, {
            method: "PATCH",
            body: JSON.stringify(form),
          })
        : await apiRequest("/tasks", {
            method: "POST",
            body: JSON.stringify(form),
          });

      if (editingTask) {
        setTasks((current) => current.map((item) => item.id === data.task.id ? data.task : item));
      } else {
        setTasks((current) => [data.task, ...current]);
      }
      setModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      setModalError(error.message || "Could not save the task.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(task, status) {
    setPageError("");
    try {
      const data = await apiRequest(`/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setTasks((current) => current.map((item) => item.id === data.task.id ? data.task : item));
    } catch (error) {
      setPageError(error.message || "Could not update task status.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setPageError("");
    try {
      await apiRequest(`/tasks/${target.id}`, { method: "DELETE" });
      setTasks((current) => current.filter((task) => task.id !== target.id));
      setDeleteTarget(null);
    } catch (error) {
      setPageError(error.message || "Could not delete the task.");
    }
  }

  return (
    <main className="tasks-page">
      <header className="tasks-page-header">
        <div>
          <p className="tasks-eyebrow">YOUR WORKSPACE</p>
          <h1>My Tasks<span>.</span></h1>
          <p className="tasks-subtitle">View and manage tasks across all your projects.</p>
        </div>
        <button type="button" className="tasks-button primary create-task-button" onClick={openCreate}>
          <span aria-hidden="true">+</span> New task
        </button>
      </header>

      <section className="tasks-stats" aria-label="Task summary">
        <button type="button" className={`tasks-stat${statusFilter === "all" ? " is-active" : ""}`} onClick={() => setStatusFilter("all")}>
          <span className="tasks-stat-label">All tasks</span><strong>{counts.all}</strong>
        </button>
        <button type="button" className={`tasks-stat${statusFilter === "todo" ? " is-active" : ""}`} onClick={() => setStatusFilter("todo")}>
          <span className="tasks-stat-label">To do</span><strong>{counts.todo}</strong>
        </button>
        <button type="button" className={`tasks-stat${statusFilter === "in_progress" ? " is-active" : ""}`} onClick={() => setStatusFilter("in_progress")}>
          <span className="tasks-stat-label">In progress</span><strong>{counts.in_progress}</strong>
        </button>
        <button type="button" className={`tasks-stat${statusFilter === "done" ? " is-active" : ""}`} onClick={() => setStatusFilter("done")}>
          <span className="tasks-stat-label">Completed</span><strong>{counts.done}</strong>
        </button>
      </section>

      <section className="tasks-list-panel">
        <div className="tasks-toolbar">
          <label className="tasks-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" />
          </label>
          <ProjectMultiSelect
            projects={projects}
            selectedIds={selectedProjectIds}
            onChange={setSelectedProjectIds}
            includeIndependent={includeIndependent}
            onIndependentChange={setIncludeIndependent}
          />
        </div>

        {pageError && <p className="tasks-page-error" role="alert">{pageError}</p>}

        {loading ? (
          <div className="tasks-state"><span className="tasks-spinner" />Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="tasks-state tasks-empty">
            <div className="tasks-empty-icon">✓</div>
            <h2>{tasks.length === 0 ? "No tasks yet" : "No tasks match these filters"}</h2>
            <p>{tasks.length === 0 ? "Create a task and optionally assign it to a project." : "Try changing your search or project filters."}</p>
            {tasks.length === 0 && <button type="button" className="tasks-button primary" onClick={openCreate}>Create your first task</button>}
          </div>
        ) : (
          <div className="tasks-table-wrap">
            <table className="tasks-table">
              <thead>
                <tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due date</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="tasks-main-cell">
                      <button type="button" className={`tasks-task-name${task.status === "done" ? " is-done" : ""}`} onClick={() => openEdit(task)}>{task.title}</button>
                      {task.description && <p>{task.description}</p>}
                    </td>
                    <td>
                      {task.projectId
                        ? <span className="tasks-project-chip">{task.projectName || projects.find((p) => p.id === task.projectId)?.name || "Project"}</span>
                        : <span className="tasks-independent-chip">Independent</span>}
                    </td>
                    <td>
                      <div className="tasks-status-select">
                        <CustomSelect
                          value={task.status}
                          onChange={(value) => updateStatus(task, value)}
                          ariaLabel={`Status for ${task.title}`}
                          options={STATUS_OPTIONS}
                        />
                      </div>
                    </td>
                    <td><span className={`tasks-priority priority-${task.priority}`}>{PRIORITY_LABELS[task.priority] || "Medium"}</span></td>
                    <td className="tasks-date-cell">{formatDate(task.dueDate)}</td>
                    <td>
                      <div className="tasks-row-actions">
                        <button type="button" aria-label={`Edit ${task.title}`} title="Edit task" onClick={() => openEdit(task)}>
                          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button type="button" className="delete" aria-label={`Delete ${task.title}`} title="Delete task" onClick={() => setDeleteTarget(task)}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredTasks.length > 0 && (
          <div className="tasks-list-footer">Showing {filteredTasks.length} of {tasks.length} tasks</div>
        )}
      </section>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        projects={projects}
        saving={saving}
        error={modalError}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={saveTask}
      />

      {deleteTarget && (
        <div className="tasks-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
          <section className="tasks-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="tasks-delete-title">
            <div className="tasks-confirm-icon">!</div>
            <h2 id="tasks-delete-title">Delete task?</h2>
            <p><strong>{deleteTarget.title}</strong> will be permanently deleted.</p>
            <div className="tasks-modal-footer">
              <button type="button" className="tasks-button secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="tasks-button danger" onClick={confirmDelete}>Delete task</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
