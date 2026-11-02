
import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_MAX_BYTES = 72;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  };
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "Name, email, and password are required.",
    });
  }

  const cleanName = name.trim();
  const cleanEmail = normalizeEmail(email);

  if (cleanName.length < 2 || cleanName.length > 100) {
    return res.status(400).json({
      message: "Name must be between 2 and 100 characters.",
    });
  }

  if (cleanEmail.length > 254 || !EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({
      message: "Enter a valid email address.",
    });
  }

  if (
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > BCRYPT_MAX_BYTES
  ) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and no more than 72 UTF-8 bytes.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [cleanName, cleanEmail, passwordHash]
    );

    const user = result.rows[0];

    // Start a fresh session to prevent session fixation.
    await regenerateSession(req);
    req.session.userId = user.id;
    await saveSession(req);

    return res.status(201).json({
      message: "Account created successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Signup failed:", error.message);
    return res.status(500).json({
      message: "Unable to create your account right now.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  const cleanEmail = normalizeEmail(email);

  if (cleanEmail.length > 254 || !EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({
      message: "Invalid email or password.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, created_at
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [cleanEmail]
    );

    const user = result.rows[0];

    // Use the same public error for unknown email and incorrect password.
    const passwordMatches =
      user && (await bcrypt.compare(password, user.password_hash));

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    await regenerateSession(req);
    req.session.userId = user.id;
    await saveSession(req);

    return res.json({
      message: "Signed in successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).json({
      message: "Unable to sign in right now.",
    });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "You are not signed in.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [req.session.userId]
    );

    const user = result.rows[0];

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({
        message: "Your session is no longer valid.",
      });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Session check failed:", error.message);
    return res.status(500).json({
      message: "Unable to verify your session right now.",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error.message);
      return res.status(500).json({
        message: "Unable to sign out right now.",
      });
    }

    res.clearCookie("taskflow.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.json({ message: "Signed out successfully." });
  });
});

// Update personal information
router.patch("/profile", async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: "Please sign in again." });
  }

  const name = typeof req.body.name === "string"
    ? req.body.name.trim()
    : "";

  const email = typeof req.body.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      message: "Name must be between 2 and 100 characters.",
    });
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).json({
      message: "Enter a valid email address.",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, created_at AS "createdAt"`,
      [name, email, userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "Account not found." });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "That email address is already in use.",
      });
    }

    console.error("Profile update failed:", error.message);
    return res.status(500).json({
      message: "Unable to update your profile right now.",
    });
  }
});

// Change password
router.patch("/password", async (req, res) => {
  const userId = req.session.userId;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Please sign in again." });
  }

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string"
  ) {
    return res.status(400).json({
      message: "Enter your current password and a new password.",
    });
  }

  if (Buffer.byteLength(newPassword, "utf8") < 8 ||
      Buffer.byteLength(newPassword, "utf8") > 72) {
    return res.status(400).json({
      message: "Your new password must be between 8 and 72 bytes.",
    });
  }

  try {
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "Account not found." });
    }

    const matches = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!matches) {
      return res.status(400).json({
        message: "Your current password is incorrect.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    );

    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Password update failed:", error.message);
    return res.status(500).json({
      message: "Unable to update your password right now.",
    });
  }
});

export default router;
