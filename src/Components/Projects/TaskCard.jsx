import { useState } from "react";
import CustomSelect from "../UI/CustomSelect/CustomSelect";

const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High" };

function formatDate(value) {
  if (!value) return "No due date";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "No due date";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onMove,
  dragging,
  onDragStart,
  onDragEnd,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article
      className={`kanban-task-card${dragging ? " is-dragging" : ""}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", task.id);
        onDragStart?.(task);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="kanban-task-card-topline">
        <span
          className={`kanban-priority priority-${task.priority || "medium"}`}
        >
          <span className="kanban-priority-dot" />
          {PRIORITY_LABELS[task.priority] || "Medium"}
        </span>
        <div className="kanban-task-actions">
          <button
            type="button"
            className="kanban-icon-button"
            aria-label={`Edit ${task.title}`}
            title="Edit task"
            onClick={() => onEdit(task)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </svg>
          </button>
          <button
            type="button"
            className="kanban-icon-button danger-icon"
            aria-label={`Delete ${task.title}`}
            title="Delete task"
            onClick={() => onDelete(task)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
            </svg>
          </button>
        </div>
      </div>

      <button
        type="button"
        className="kanban-task-title-button"
        onClick={() => onEdit(task)}
      >
        <h3>{task.title}</h3>
      </button>
      {task.description && (
        <p className="kanban-task-description">{task.description}</p>
      )}

      <div className="kanban-task-card-footer">
        <span
          className={`kanban-task-due${task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "done" ? " is-overdue" : ""}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
          {formatDate(task.dueDate)}
        </span>
        <label className="kanban-move-control">
          <span className="sr-only">Move task status</span> 
          <CustomSelect
            value={task.status}
            onChange={(event) => onMove(task, event.target.value)}
            aria-label={`Move ${task.title}`}
            options={[
              { value: "todo", label: "To Do"},
              { value: "in_progress", label: "In progress"},
              { value: "done", label: "Done"},
            ]}
          />
        </label>
      </div>
    </article>
  );
}