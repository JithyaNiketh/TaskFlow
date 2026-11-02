import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../../server/src/lib/api";
import KanbanBoard from "../../Components/Projects/KanbanBoard";
import TaskModal from "../../Components/Projects/TaskModal";
import ConfirmationModal from "../../Components/UI/ConfirmationModal/ConfirmationModal";
import "../../Components/Projects/KanbanBoard.css";

const STATUS_LABELS = {
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

export default function ProjectsBoard() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [initialStatus, setInitialStatus] = useState("todo");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBoard = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setPageError("");
    try {
      const [projectData, taskData] = await Promise.all([
        apiRequest(`/projects/${projectId}`),
        apiRequest(`/projects/${projectId}/tasks`),
      ]);
      setProject(projectData.project);
      setTasks(taskData.tasks || []);
    } catch (error) {
      setPageError(error.message || "Could not load this project board.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description || "").toLowerCase().includes(query),
    );
  }, [tasks, search]);

  const counts = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo").length,
      in_progress: tasks.filter((task) => task.status === "in_progress").length,
      done: tasks.filter((task) => task.status === "done").length,
    }),
    [tasks],
  );

  function openCreateTask(status = "todo") {
    setEditingTask(null);
    setInitialStatus(status);
    setFormError("");
    setModalOpen(true);
  }

  function openEditTask(task) {
    setEditingTask(task);
    setInitialStatus(task.status);
    setFormError("");
    setModalOpen(true);
  }

  async function saveTask(form) {
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form, status: editingTask?.status || initialStatus };
      const result = editingTask
        ? await apiRequest(`/projects/${projectId}/tasks/${editingTask.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiRequest(`/projects/${projectId}/tasks`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
      if (editingTask)
        setTasks((current) =>
          current.map((task) =>
            task.id === result.task.id ? result.task : task,
          ),
        );
      else setTasks((current) => [...current, result.task]);
      setModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      setFormError(error.message || "Could not save this task.");
    } finally {
      setSaving(false);
    }
  }

  async function moveTask(task, status) {
    if (task.status === status || busyTaskId) return;
    setBusyTaskId(task.id);
    const previous = task.status;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status } : item)),
    );
    try {
      const result = await apiRequest(
        `/projects/${projectId}/tasks/${task.id}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? result.task : item)),
      );
    } catch (error) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status: previous } : item,
        ),
      );
      setPageError(error.message || "Could not move the task.");
    } finally {
      setBusyTaskId(null);
    }
  }

  async function confirmDeleteTask() {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await apiRequest(`/projects/${projectId}/tasks/${taskToDelete.id}`, {
        method: "DELETE",
      });
      setTasks((current) =>
        current.filter((task) => task.id !== taskToDelete.id),
      );
      setTaskToDelete(null);
    } catch (error) {
      setPageError(error.message || "Could not delete this task.");
      setTaskToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  if (loading)
    return (
      <section className="kanban-workspace">
        <div className="kanban-loading">Loading your project board...</div>
      </section>
    );
  if (pageError && !project)
    return (
      <section className="kanban-workspace">
        <div className="kanban-error">
          <strong>We couldn't load this board.</strong>
          <p>{pageError}</p>
          <button type="button" onClick={loadBoard}>
            Try again
          </button>
          <Link className="kanban-back-link" to="/projects">
            ← Back to projects
          </Link>
        </div>
      </section>
    );

  return (
    <section className="kanban-workspace">
      <Link className="kanban-back-link" to="/projects">
        ← Back to projects
      </Link>
      <header className="kanban-page-heading">
        <div>
          <p className="kanban-eyebrow">PROJECT WORKSPACE</p>
          <h1>
            {project?.name || "Project board"}
            <span>.</span>
          </h1>
          <p>
            {project?.description || "Plan, organize, and track your work."}
          </p>
          <div className="kanban-project-meta">
            <span className="kanban-project-status">
              {STATUS_LABELS[project?.status] || "Project"}
            </span>
            <span>
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="kanban-button primary"
          onClick={() => openCreateTask("todo")}
        >
          <span aria-hidden="true">＋</span> New task
        </button>
      </header>

      {pageError && (
        <div
          className="kanban-form-error"
          role="alert"
          style={{ marginBottom: 16 }}
        >
          {pageError}
          <button
            type="button"
            onClick={() => setPageError("")}
            aria-label="Dismiss error"
            style={{
              float: "right",
              background: "none",
              border: 0,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="kanban-board-toolbar">
        <div className="kanban-board-stats">
          <div className="kanban-stat">
            To do <strong>{String(counts.todo).padStart(2, "0")}</strong>
          </div>
          <div className="kanban-stat">
            In progress{" "}
            <strong>{String(counts.in_progress).padStart(2, "0")}</strong>
          </div>
          <div className="kanban-stat">
            Done <strong>{String(counts.done).padStart(2, "0")}</strong>
          </div>
        </div>
        <label className="kanban-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
          />
        </label>
      </div>

      {tasks.length === 0 ? (
        <div className="kanban-empty-board">
          <h2>Your board starts here.</h2>
          <p>
            Create your first task, then move it across columns as work
            progresses.
          </p>
          <button
            type="button"
            className="kanban-button primary"
            onClick={() => openCreateTask("todo")}
          >
            ＋ Create your first task
          </button>
        </div>
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          onCreateTask={openCreateTask}
          onEditTask={openEditTask}
          onDeleteTask={setTaskToDelete}
          onMoveTask={moveTask}
          busyTaskId={busyTaskId}
        />
      )}

      {tasks.length > 0 && filteredTasks.length === 0 && (
        <div className="kanban-empty-board">
          <h2>No tasks match your search.</h2>
          <p>Try a different title or description.</p>
        </div>
      )}

      <TaskModal
        open={modalOpen}
        task={editingTask}
        saving={saving}
        error={formError}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditingTask(null);
          }
        }}
        onSave={saveTask}
      />
      <ConfirmationModal
        isOpen={Boolean(taskToDelete)}
        title="Delete task?"
        message={
          taskToDelete
            ? `Delete “${taskToDelete.title}”? This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmText={deleting ? "Deleting..." : "Delete task"}
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onCancel={() => {
          if (!deleting) setTaskToDelete(null);
        }}
        onConfirm={confirmDeleteTask}
      />
    </section>
  );
}