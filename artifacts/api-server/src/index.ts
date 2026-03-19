import app from "./app";
import { db, usersTable } from "@workspace/db";
import { hashPassword } from "./lib/auth";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedAdminIfNeeded() {
  try {
    const existing = await db.select().from(usersTable).limit(1);
    if (existing.length > 0) {
      console.log("Seed skipped: users already exist.");
      return;
    }

    await db.insert(usersTable).values({
      username: "admin",
      fullName: "Administrador",
      passwordHash: hashPassword("Admin77777"),
      role: "admin",
      phone: null,
    });

    console.log("Seed: admin user created (admin / Admin77777).");
  } catch (err) {
    console.error("Seed error:", err);
  }
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  seedAdminIfNeeded();
});
