import { useMemo, useState } from "react";
import TaskCard from "./TaskCard";

const COLUMNS = [
  {
    id: "todo",
    title: "To do",
    color: "neutral",
  },
  {
    id: "in_progress",
    title: "In progress",
    color: "lavender",
  },
  {
    id: "done",
    title: "Done",
    color: "green",
  },
];

export default function KanbanBoard({
  tasks,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  busyTaskId,
}) {
  const [draggedId, setDraggedId] = useState(null);
  const groupedTasks = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((column) => [
          column.id,
          tasks.filter((task) => task.status === column.id),
        ]),
      ),
    [tasks],
  );

  return (
    <div className="kanban-board" aria-label="Task board">
      {COLUMNS.map((column) => (
        <section
          key={column.id}
          className={`kanban-column column-${column.color}${draggedId ? " has-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            const id = event.dataTransfer.getData("text/plain") || draggedId;
            const task = tasks.find((item) => item.id === id);
            console.log(task)
            if (task && task.status !== column.id) onMoveTask(task, column.id);
            setDraggedId(null);
          }}
        >
          <header className="kanban-column-header">
            <div className="kanban-column-title-wrap">
              <span className="kanban-column-dot" />
              <div>
                <h2>{column.title}</h2>
              </div>
            </div>
            <span className="kanban-count">
              {String(groupedTasks[column.id].length).padStart(2, "0")}
            </span>
          </header>
          <div className="kanban-column-cards">
            {groupedTasks[column.id].map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                dragging={draggedId === task.id || busyTaskId === task.id}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onMove={onMoveTask}
                onDragStart={(item) => setDraggedId(item.id)}
                onDragEnd={() => setDraggedId(null)}
              />
            ))}
            {groupedTasks[column.id].length === 0 && (
              <div className="kanban-empty-column">
                <span>Nothing here yet</span>
                <small>Drop a task here or add one</small>
              </div>
            )}
          </div>
          <button
            type="button"
            className="kanban-add-task"
            onClick={() => onCreateTask(column.id)}
          >
            <span>＋</span> Add task
          </button>
        </section>
      ))}
    </div>
  );
}