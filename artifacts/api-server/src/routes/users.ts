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
    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      username,
      passwordHash,
      fullName,
      role,
      phone,
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
    const currentUser = (req as any).user;
    if (currentUser.role !== "admin" && currentUser.id !== id) {
      res.status(403).json({ error: "Forbidden" });
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
    const currentUser = (req as any).user;
    if (currentUser.role !== "admin" && currentUser.id !== id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { fullName, password, phone, role } = req.body;
    const updates: Record<string, any> = {};
    if (fullName) updates.fullName = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (password) updates.passwordHash = hashPassword(password);
    if (role && currentUser.role === "admin") updates.role = role;

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
      res.status(404).json({ error: "Not Found" });
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
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
