
import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router();

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  next();
}

function normalizeProject(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isValidStatus(status) {
  return ["active", "on_hold", "completed"].includes(status);
}

// Require authentication for every endpoint in this file.
router.use(requireAuth);

// GET /api/projects — list the logged-in user's projects
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, status, due_date,
              created_at, updated_at
       FROM projects
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.session.userId]
    );

    res.json({ projects: result.rows.map(normalizeProject) });
  } catch (error) {
    console.error("List projects error:", error);
    res.status(500).json({ message: "Failed to load projects." });
  }
});

// POST /api/projects — create a project
router.post("/", async (req, res) => {
  try {
    const { name, description = "", dueDate = null } = req.body;
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return res.status(400).json({
        message: "Project name is required.",
      });
    }

    if (trimmedName.length > 120) {
      return res.status(400).json({
        message: "Project name must be 120 characters or fewer.",
      });
    }

    if (typeof description !== "string") {
      return res.status(400).json({
        message: "Description must be text.",
      });
    }

    if (description.length > 10000) {
      return res.status(400).json({
        message: "Description is too long.",
      });
    }

    if (
      dueDate !== null &&
      (typeof dueDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
        Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`)) ||
        new Date(`${dueDate}T00:00:00Z`).toISOString().slice(0, 10) !== dueDate)
    ) {
      return res.status(400).json({
        message: "Due date must be a valid date in YYYY-MM-DD format.",
      });
    }

    const result = await pool.query(
      `INSERT INTO projects (user_id, name, description, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, status, due_date,
                 created_at, updated_at`,
      [req.session.userId, trimmedName, description.trim(), dueDate]
    );

    res.status(201).json({
      project: normalizeProject(result.rows[0]),
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Failed to create project." });
  }
});

// GET /api/projects/:projectId — get one project
router.get("/:projectId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, status, due_date,
              created_at, updated_at
       FROM projects
       WHERE id = $1 AND user_id = $2`,
      [req.params.projectId, req.session.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json({ project: normalizeProject(result.rows[0]) });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    console.error("Get project error:", error);
    res.status(500).json({ message: "Failed to load project." });
  }
});

// PATCH /api/projects/:projectId — update a project
router.patch("/:projectId", async (req, res) => {
  try {
    const allowedFields = ["name", "description", "status", "dueDate"];
    const suppliedFields = allowedFields.filter((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field)
    );

    if (suppliedFields.length === 0) {
      return res.status(400).json({
        message: "Provide at least one field to update.",
      });
    }

    const values = [];
    const updates = [];

    for (const field of suppliedFields) {
      const value = req.body[field];

      if (field === "name") {
        if (typeof value !== "string" || !value.trim()) {
          return res.status(400).json({
            message: "Project name is required.",
          });
        }

        if (value.trim().length > 120) {
          return res.status(400).json({
            message: "Project name must be 120 characters or fewer.",
          });
        }

        values.push(value.trim());
        updates.push(`name = $${values.length}`);
      }

      if (field === "description") {
        if (typeof value !== "string" || value.length > 10000) {
          return res.status(400).json({
            message: "Description must be text up to 10,000 characters.",
          });
        }

        values.push(value.trim());
        updates.push(`description = $${values.length}`);
      }

      if (field === "status") {
        if (!isValidStatus(value)) {
          return res.status(400).json({
            message: "Status must be active, on_hold, or completed.",
          });
        }

        values.push(value);
        updates.push(`status = $${values.length}`);
      }

      if (field === "dueDate") {
        if (
          value !== null &&
          (typeof value !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
            new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value)
        ) {
          return res.status(400).json({
            message: "Due date must be null or a valid YYYY-MM-DD date.",
          });
        }

        values.push(value);
        updates.push(`due_date = $${values.length}`);
      }
    }

    updates.push("updated_at = NOW()");
    values.push(req.params.projectId, req.session.userId);

    const result = await pool.query(
      `UPDATE projects
       SET ${updates.join(", ")}
       WHERE id = $${values.length - 1}
         AND user_id = $${values.length}
       RETURNING id, name, description, status, due_date,
                 created_at, updated_at`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json({ project: normalizeProject(result.rows[0]) });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    console.error("Update project error:", error);
    res.status(500).json({ message: "Failed to update project." });
  }
});

// DELETE /api/projects/:projectId — delete a project
router.delete("/:projectId", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM projects
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.projectId, req.session.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Related tasks are deleted automatically by the database's
    // ON DELETE CASCADE constraint.
    res.json({ message: "Project deleted successfully." });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    console.error("Delete project error:", error);
    res.status(500).json({ message: "Failed to delete project." });
  }
});

export default router;
