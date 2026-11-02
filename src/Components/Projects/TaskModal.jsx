import { useEffect, useState } from "react";
import CustomSelect from "../UI/CustomSelect/CustomSelect"
import CustomDatePicker from "../UI/CustomDatePicker/CustomDatePicker"

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
};

export default function TaskModal({
  open,
  task,
  saving,
  error,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(
      task
        ? {
            title: task.title || "",
            description: task.description || "",
            priority: task.priority || "medium",
            dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : "",
          }
        : EMPTY_FORM,
    );
  }, [open, task]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
    });
  }

  return (
    <div
      className="kanban-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        className="kanban-task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-task-modal-title"
      >
        <header className="kanban-modal-header">
          <div>
            <p className="kanban-eyebrow">TASK DETAILS</p>
            <h2 id="kanban-task-modal-title">
              {task ? "Edit task" : "Create a task"}
            </h2>
          </div>
          <button
            type="button"
            className="kanban-modal-close"
            aria-label="Close modal"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </header>
        <form onSubmit={submit} className="kanban-task-form">
          <label className="kanban-field">
            <span>
              Task title <b>*</b>
            </span>
            <input
              autoFocus
              maxLength={200}
              required
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Design the landing page"
            />
          </label>
          <label className="kanban-field">
            <span>Description</span>
            <textarea
              rows={4}
              maxLength={3000}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Add some details about this task..."
            />
          </label>
          <div className="kanban-form-row">
            <label className="kanban-field">
              <span>Priority</span>
              <CustomSelect
                value={form.priority}
                onChange={(value) => update("priority", value)}
                ariaLabel="Task priority"
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
            </label>

            <label className="kanban-field">
              <span>Due date</span>
              <CustomDatePicker
                value={form.dueDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(value) => update("dueDate", value)}
              />
            </label>
          </div>
          {error && (
            <p className="kanban-form-error" role="alert">
              {error}
            </p>
          )}
          <footer className="kanban-modal-footer">
            <button
              type="button"
              className="kanban-button secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="kanban-button primary"
              disabled={saving}
            >
              {saving ? "Saving..." : task ? "Save changes" : "Create task"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
