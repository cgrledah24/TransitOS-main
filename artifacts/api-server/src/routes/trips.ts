import { Router } from "express";
import { db, tripsTable, usersTable } from "@workspace/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentUser = (req as any).user;

    let dateFilter = sql`1=1`;
    if (year && month) {
      dateFilter = sql`EXTRACT(YEAR FROM ${tripsTable.date}::date) = ${parseInt(year as string)} AND EXTRACT(MONTH FROM ${tripsTable.date}::date) = ${parseInt(month as string)}`;
    } else if (year) {
      dateFilter = sql`EXTRACT(YEAR FROM ${tripsTable.date}::date) = ${parseInt(year as string)}`;
    }

    let driverFilter = sql`1=1`;
    if (currentUser.role === "driver") {
      driverFilter = eq(tripsTable.driverId, currentUser.id);
    }

    const trips = await db.select({
      id: tripsTable.id,
      status: tripsTable.status,
      amount: tripsTable.amount,
      driverId: tripsTable.driverId,
      date: tripsTable.date,
    }).from(tripsTable).where(and(dateFilter, driverFilter));

    const totalTrips = trips.length;
    const totalRevenue = trips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const completedTrips = trips.filter(t => t.status === "completed").length;
    const scheduledTrips = trips.filter(t => t.status === "scheduled").length;

    const driverMap = new Map<number, { count: number; amount: number }>();
    for (const trip of trips) {
      const existing = driverMap.get(trip.driverId) || { count: 0, amount: 0 };
      driverMap.set(trip.driverId, {
        count: existing.count + 1,
        amount: existing.amount + (trip.amount || 0),
      });
    }

    const driverIds = Array.from(driverMap.keys());
    const driverUsers = driverIds.length > 0
      ? await db.select({ id: usersTable.id, fullName: usersTable.fullName }).from(usersTable).where(
          inArray(usersTable.id, driverIds)
        )
      : [];

    const byDriver = driverUsers.map(d => ({
      driverId: d.id,
      driverName: d.fullName,
      tripCount: driverMap.get(d.id)?.count || 0,
      totalAmount: driverMap.get(d.id)?.amount || 0,
    }));

    const monthMap = new Map<string, { count: number; amount: number }>();
    for (const trip of trips) {
      const key = trip.date.substring(0, 7);
      const existing = monthMap.get(key) || { count: 0, amount: 0 };
      monthMap.set(key, {
        count: existing.count + 1,
        amount: existing.amount + (trip.amount || 0),
      });
    }

    const byMonth = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        tripCount: data.count,
        totalAmount: data.amount,
      }));

    res.json({ totalTrips, totalRevenue, completedTrips, scheduledTrips, byDriver, byMonth });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { year, month, driverId } = req.query;
    const currentUser = (req as any).user;

    const conditions: any[] = [];

    if (year && month) {
      conditions.push(sql`EXTRACT(YEAR FROM ${tripsTable.date}::date) = ${parseInt(year as string)} AND EXTRACT(MONTH FROM ${tripsTable.date}::date) = ${parseInt(month as string)}`);
    } else if (year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${tripsTable.date}::date) = ${parseInt(year as string)}`);
    }

    if (currentUser.role === "driver") {
      conditions.push(eq(tripsTable.driverId, currentUser.id));
    } else if (driverId) {
      conditions.push(eq(tripsTable.driverId, parseInt(driverId as string)));
    }

    const trips = await db
      .select({
        id: tripsTable.id,
        date: tripsTable.date,
        origin: tripsTable.origin,
        destination: tripsTable.destination,
        driverId: tripsTable.driverId,
        driverName: usersTable.fullName,
        notes: tripsTable.notes,
        amount: tripsTable.amount,
        status: tripsTable.status,
        createdAt: tripsTable.createdAt,
      })
      .from(tripsTable)
      .leftJoin(usersTable, eq(tripsTable.driverId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(trips);
  } catch (err) {
    console.error("List trips error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { date, origin, destination, driverId, notes, amount, status } = req.body;
    if (!date || !origin || !destination || !driverId) {
      res.status(400).json({ error: "Bad Request", message: "Missing required fields" });
      return;
    }
    const [trip] = await db.insert(tripsTable).values({
      date,
      origin,
      destination,
      driverId,
      notes,
      amount,
      status: status || "scheduled",
    }).returning();

    const [driver] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, trip.driverId));
    res.status(201).json({ ...trip, driverName: driver?.fullName || null });
  } catch (err) {
    console.error("Create trip error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const currentUser = (req as any).user;

    const [trip] = await db.select({
      id: tripsTable.id,
      date: tripsTable.date,
      origin: tripsTable.origin,
      destination: tripsTable.destination,
      driverId: tripsTable.driverId,
      driverName: usersTable.fullName,
      notes: tripsTable.notes,
      amount: tripsTable.amount,
      status: tripsTable.status,
      createdAt: tripsTable.createdAt,
    }).from(tripsTable)
      .leftJoin(usersTable, eq(tripsTable.driverId, usersTable.id))
      .where(eq(tripsTable.id, id));

    if (!trip) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    if (currentUser.role === "driver" && trip.driverId !== currentUser.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json(trip);
  } catch (err) {
    console.error("Get trip error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid trip ID" });
      return;
    }

    const currentUser = (req as any).user;

    // Fetch the existing trip to verify ownership for drivers
    const [existing] = await db.select().from(tripsTable).where(eq(tripsTable.id, id));
    if (!existing) {
      res.status(404).json({ error: "Not Found", message: "Trip not found" });
      return;
    }

    const { date, origin, destination, driverId, notes, amount, status } = req.body;
    const updates: Record<string, any> = {};

    if (currentUser.role === "driver") {
      // Drivers can only update status of their own assigned trips
      if (existing.driverId !== currentUser.id) {
        res.status(403).json({ error: "Forbidden", message: "You can only update your own trips" });
        return;
      }
      // Drivers can only change status (not other fields)
      if (status === undefined) {
        res.status(400).json({ error: "Bad Request", message: "Drivers can only update the trip status" });
        return;
      }
      // Drivers cannot cancel trips
      const allowedStatuses = ["scheduled", "in_progress", "completed"];
      if (!allowedStatuses.includes(status)) {
        res.status(400).json({ error: "Bad Request", message: "Drivers can only set status to: scheduled, in_progress, or completed" });
        return;
      }
      // Enforce valid transitions: scheduled → in_progress → completed
      const validTransitions: Record<string, string[]> = {
        scheduled: ["in_progress"],
        in_progress: ["completed", "scheduled"],
        completed: [],
      };
      const allowed = validTransitions[existing.status] ?? [];
      if (!allowed.includes(status)) {
        res.status(400).json({
          error: "Bad Request",
          message: `Cannot change status from '${existing.status}' to '${status}'`,
        });
        return;
      }
      updates.status = status;
    } else {
      // Admins can update any field
      if (date !== undefined) updates.date = date;
      if (origin !== undefined) updates.origin = origin;
      if (destination !== undefined) updates.destination = destination;
      if (driverId !== undefined) updates.driverId = driverId;
      if (notes !== undefined) updates.notes = notes;
      if (amount !== undefined) updates.amount = amount;
      if (status !== undefined) updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Bad Request", message: "No valid fields to update" });
      return;
    }

    const [trip] = await db.update(tripsTable).set(updates).where(eq(tripsTable.id, id)).returning();
    if (!trip) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const [driver] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, trip.driverId));
    res.json({ ...trip, driverName: driver?.fullName || null });
  } catch (err) {
    console.error("Update trip error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(tripsTable).where(eq(tripsTable.id, id));
    res.json({ success: true, message: "Trip deleted" });
  } catch (err) {
    console.error("Delete trip error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
