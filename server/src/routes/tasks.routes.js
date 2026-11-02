import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router({ mergeParams: true });
const STATUSES = new Set(["todo", "in_progress", "done"]);
const PRIORITIES = new Set(["low", "medium", "high"]);

function publicTask(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name ?? null,
    title: row.title,
    description: row.description || "",
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date || null,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateDueDate(dueDate) {
  return !dueDate ||
    (typeof dueDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dueDate) &&
      !Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`)));
}

async function ownedProject(projectId, userId) {
  if (!projectId) return false;
  const result = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
    [projectId, userId]
  );
  return result.rowCount > 0;
}

router.use((req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Please sign in to manage tasks." });
  }
  next();
});

// GET /api/tasks returns all of this user's tasks.
// GET /api/projects/:projectId/tasks returns tasks for one owned project.
router.get("/", async (req, res) => {
  const { projectId } = req.params;
  const userId = req.session.userId;
  try {
    if (projectId && !(await ownedProject(projectId, userId))) {
      return res.status(404).json({ message: "Project not found." });
    }

    const values = projectId ? [userId, projectId] : [userId];
    const projectCondition = projectId ? "AND t.project_id = $2" : "";
    const result = await pool.query(
      `SELECT t.id, t.project_id, p.name AS project_name, t.title, t.description,
              t.status, t.priority, t.due_date::text AS due_date, t.position,
              t.created_at, t.updated_at
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id AND p.user_id = t.user_id
       WHERE t.user_id = $1 ${projectCondition}
       ORDER BY CASE t.status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END,
                t.position, t.created_at DESC`,
      values
    );
    return res.json({ tasks: result.rows.map(publicTask) });
  } catch (error) {
    console.error("Tasks load failed:", error.message);
    return res.status(500).json({ message: "Unable to load tasks right now." });
  }
});

router.post("/", async (req, res) => {
  const routeProjectId = req.params.projectId;
  const body = req.body || {};
  const userId = req.session.userId;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const priority = body.priority || "medium";
  const status = body.status || "todo";
  const dueDate = body.dueDate || null;
  const projectId = routeProjectId || body.projectId || null;

  if (!title || title.length > 200) {
    return res.status(400).json({ message: "Task title is required and must be 200 characters or fewer." });
  }
  if (description.length > 3000) {
    return res.status(400).json({ message: "Description must be 3000 characters or fewer." });
  }
  if (!PRIORITIES.has(priority)) {
    return res.status(400).json({ message: "Choose a valid priority." });
  }
  if (!STATUSES.has(status)) {
    return res.status(400).json({ message: "Choose a valid task status." });
  }
  if (!validateDueDate(dueDate)) {
    return res.status(400).json({ message: "Choose a valid due date." });
  }

  try {
    if (projectId && !(await ownedProject(projectId, userId))) {
      return res.status(404).json({ message: "Project not found." });
    }
    const result = await pool.query(
      `INSERT INTO tasks
         (project_id, user_id, title, description, status, priority, due_date, position)
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         COALESCE((
           SELECT MAX(position) + 1
           FROM tasks
           WHERE project_id IS NOT DISTINCT FROM $1::uuid AND status = $5
         ), 0)
       )
       RETURNING id, project_id, title, description, status, priority,
                 due_date::text AS due_date, position, created_at, updated_at`,
      [projectId, userId, title, description, status, priority, dueDate]
    );
    const row = result.rows[0];
    let projectName = null;
    if (row.project_id) {
      const project = await pool.query(
        "SELECT name FROM projects WHERE id = $1 AND user_id = $2",
        [row.project_id, userId]
      );
      projectName = project.rows[0]?.name ?? null;
    }
    return res.status(201).json({ task: publicTask({ ...row, project_name: projectName }) });
  } catch (error) {
    console.error("Task create failed:", error.message);
    return res.status(500).json({ message: "Unable to create this task right now." });
  }
});

router.patch("/:taskId", async (req, res) => {
  const { projectId: routeProjectId, taskId } = req.params;
  const userId = req.session.userId;
  const body = req.body || {};
  const fields = [];
  const values = [taskId, userId];

  if (Object.hasOwn(body, "title")) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 200) {
      return res.status(400).json({ message: "Task title is required and must be 200 characters or fewer." });
    }
    values.push(title);
    fields.push(`title = $${values.length}`);
  }
  if (Object.hasOwn(body, "description")) {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (description.length > 3000) {
      return res.status(400).json({ message: "Description must be 3000 characters or fewer." });
    }
    values.push(description);
    fields.push(`description = $${values.length}`);
  }
  if (Object.hasOwn(body, "status")) {
    if (!STATUSES.has(body.status)) {
      return res.status(400).json({ message: "Choose a valid task status." });
    }
    values.push(body.status);
    fields.push(`status = $${values.length}`);
  }
  if (Object.hasOwn(body, "priority")) {
    if (!PRIORITIES.has(body.priority)) {
      return res.status(400).json({ message: "Choose a valid priority." });
    }
    values.push(body.priority);
    fields.push(`priority = $${values.length}`);
  }
  if (Object.hasOwn(body, "dueDate")) {
    const dueDate = body.dueDate || null;
    if (!validateDueDate(dueDate)) {
      return res.status(400).json({ message: "Choose a valid due date." });
    }
    values.push(dueDate);
    fields.push(`due_date = $${values.length}`);
  }
  if (Object.hasOwn(body, "projectId") && !routeProjectId) {
    const newProjectId = body.projectId || null;
    if (newProjectId && !(await ownedProject(newProjectId, userId))) {
      return res.status(404).json({ message: "Project not found." });
    }
    values.push(newProjectId);
    fields.push(`project_id = $${values.length}`);
  }

  if (!fields.length) {
    return res.status(400).json({ message: "No task changes were provided." });
  }
  fields.push("updated_at = NOW()");

  try {
    const routeScope = routeProjectId
      ? (values.push(routeProjectId), ` AND project_id = $${values.length}`)
      : "";
    const result = await pool.query(
      `UPDATE tasks SET ${fields.join(", ")}
       WHERE id = $1 AND user_id = $2${routeScope}
       RETURNING id, project_id, title, description, status, priority,
                 due_date::text AS due_date, position, created_at, updated_at`,
      values
    );
    if (!result.rowCount) return res.status(404).json({ message: "Task not found." });

    const row = result.rows[0];
    let projectName = null;
    if (row.project_id) {
      const project = await pool.query(
        "SELECT name FROM projects WHERE id = $1 AND user_id = $2",
        [row.project_id, userId]
      );
      projectName = project.rows[0]?.name ?? null;
    }
    return res.json({ task: publicTask({ ...row, project_name: projectName }) });
  } catch (error) {
    console.error("Task update failed:", error.message);
    return res.status(500).json({ message: "Unable to update this task right now." });
  }
});

router.delete("/:taskId", async (req, res) => {
  const { projectId, taskId } = req.params;
  const userId = req.session.userId;
  try {
    if (projectId && !(await ownedProject(projectId, userId))) {
      return res.status(404).json({ message: "Project not found." });
    }
    const values = projectId ? [taskId, userId, projectId] : [taskId, userId];
    const projectCondition = projectId ? " AND project_id = $3" : "";
    const result = await pool.query(
      `DELETE FROM tasks WHERE id = $1 AND user_id = $2${projectCondition} RETURNING id`,
      values
    );
    if (!result.rowCount) return res.status(404).json({ message: "Task not found." });
    return res.json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Task delete failed:", error.message);
    return res.status(500).json({ message: "Unable to delete this task right now." });
  }
});

export default router;
