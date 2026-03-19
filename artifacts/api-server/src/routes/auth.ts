import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signToken, requireAuth } from "../lib/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Bad Request", message: "Username and password required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    const token = signToken(user.id, user.role);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
  });
});

export default router;
