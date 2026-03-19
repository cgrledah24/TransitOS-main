import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      fullName: usersTable.fullName,
      role: usersTable.role,
      phone: usersTable.phone,
      createdAt: usersTable.createdAt,
    }).from(usersTable);
    res.json(users);
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { username, password, fullName, role, phone } = req.body;

    if (!username || !password || !fullName || !role) {
      res.status(400).json({ error: "Bad Request", message: "Missing required fields" });
      return;
    }
    if (typeof username !== "string" || username.trim().length < 3) {
      res.status(400).json({ error: "Bad Request", message: "Username must be at least 3 characters" });
      return;
    }
    if (typeof fullName !== "string" || fullName.trim().length < 2) {
      res.status(400).json({ error: "Bad Request", message: "Full name must be at least 2 characters" });
      return;
    }
    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Bad Request", message: "Password must be at least 6 characters" });
      return;
    }
    if (!["admin", "driver"].includes(role)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid role" });
      return;
    }

    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      username: username.trim(),
      passwordHash,
      fullName: fullName.trim(),
      role,
      phone: phone?.trim() || null,
    }).returning({
      id: usersTable.id,
      username: usersTable.username,
      fullName: usersTable.fullName,
      role: usersTable.role,
      phone: usersTable.phone,
      createdAt: usersTable.createdAt,
    });
    res.status(201).json(user);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "Bad Request", message: "Username already exists" });
      return;
    }
    console.error("Create user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid user ID" });
      return;
    }
    const currentUser = (req as any).user;
    if (currentUser.role !== "admin" && currentUser.id !== id) {
      res.status(403).json({ error: "Forbidden", message: "You do not have permission to view this user" });
      return;
    }
    const [user] = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      fullName: usersTable.fullName,
      role: usersTable.role,
      phone: usersTable.phone,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, id));
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid user ID" });
      return;
    }

    const currentUser = (req as any).user;

    // Security: only the user themselves or an admin can update
    if (currentUser.role !== "admin" && currentUser.id !== id) {
      res.status(403).json({ error: "Forbidden", message: "You do not have permission to update this user" });
      return;
    }

    const { fullName, password, phone, role } = req.body;
    const updates: Record<string, any> = {};

    // Validate fullName if provided
    if (fullName !== undefined) {
      if (typeof fullName !== "string" || fullName.trim().length < 2) {
        res.status(400).json({ error: "Bad Request", message: "Full name must be at least 2 characters" });
        return;
      }
      updates.fullName = fullName.trim();
    }

    // Validate password if provided
    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 6) {
        res.status(400).json({ error: "Bad Request", message: "Password must be at least 6 characters" });
        return;
      }
      // Additional strength check: at least one letter and one number
      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        res.status(400).json({ error: "Bad Request", message: "Password must contain at least one letter and one number" });
        return;
      }
      updates.passwordHash = hashPassword(password);
    }

    // Validate phone if provided
    if (phone !== undefined) {
      updates.phone = phone?.trim() || null;
    }

    // Security: only admins can change roles
    if (role !== undefined) {
      if (currentUser.role !== "admin") {
        res.status(403).json({ error: "Forbidden", message: "Only administrators can change roles" });
        return;
      }
      if (!["admin", "driver"].includes(role)) {
        res.status(400).json({ error: "Bad Request", message: "Invalid role" });
        return;
      }
      // Security: admin cannot demote themselves
      if (currentUser.id === id && role !== "admin") {
        res.status(400).json({ error: "Bad Request", message: "You cannot change your own admin role" });
        return;
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Bad Request", message: "No valid fields to update" });
      return;
    }

    const [user] = await db.update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        fullName: usersTable.fullName,
        role: usersTable.role,
        phone: usersTable.phone,
        createdAt: usersTable.createdAt,
      });

    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid user ID" });
      return;
    }
    const currentUser = (req as any).user;
    // Security: admin cannot delete themselves
    if (currentUser.id === id) {
      res.status(400).json({ error: "Bad Request", message: "You cannot delete your own account" });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
