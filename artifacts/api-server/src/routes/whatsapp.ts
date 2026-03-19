import { Router } from "express";
import { db, whatsappConfigTable, whatsappMessagesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/config", requireAdmin, async (req, res) => {
  try {
    const configs = await db.select().from(whatsappConfigTable);
    if (configs.length === 0) {
      res.json({
        phoneNumberId: null,
        accessToken: null,
        verifyToken: null,
        businessAccountId: null,
        isConfigured: false,
      });
      return;
    }
    const config = configs[0];
    res.json({
      phoneNumberId: config.phoneNumberId,
      accessToken: config.accessToken ? "***" : null,
      verifyToken: config.verifyToken,
      businessAccountId: config.businessAccountId,
      isConfigured: !!(config.phoneNumberId && config.accessToken),
    });
  } catch (err) {
    console.error("Get WA config error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/config", requireAdmin, async (req, res) => {
  try {
    const { phoneNumberId, accessToken, verifyToken, businessAccountId } = req.body;
    const configs = await db.select().from(whatsappConfigTable);
    let config;
    if (configs.length === 0) {
      [config] = await db.insert(whatsappConfigTable).values({
        phoneNumberId,
        accessToken,
        verifyToken,
        businessAccountId,
      }).returning();
    } else {
      [config] = await db.update(whatsappConfigTable)
        .set({ phoneNumberId, accessToken, verifyToken, businessAccountId, updatedAt: new Date() })
        .where(eq(whatsappConfigTable.id, configs[0].id))
        .returning();
    }
    res.json({
      phoneNumberId: config.phoneNumberId,
      accessToken: config.accessToken ? "***" : null,
      verifyToken: config.verifyToken,
      businessAccountId: config.businessAccountId,
      isConfigured: !!(config.phoneNumberId && config.accessToken),
    });
  } catch (err) {
    console.error("Update WA config error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/messages", requireAuth, async (req, res) => {
  try {
    const { contactPhone, limit } = req.query;
    const lim = limit ? parseInt(limit as string) : 50;
    let query = db.select().from(whatsappMessagesTable).orderBy(desc(whatsappMessagesTable.createdAt)).limit(lim);
    if (contactPhone) {
      const messages = await db.select().from(whatsappMessagesTable)
        .where(eq(whatsappMessagesTable.contactPhone, contactPhone as string))
        .orderBy(whatsappMessagesTable.createdAt)
        .limit(lim);
      res.json(messages);
      return;
    }
    const messages = await query;
    res.json(messages);
  } catch (err) {
    console.error("List messages error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/messages", requireAuth, async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      res.status(400).json({ error: "Bad Request", message: "to and message are required" });
      return;
    }

    const configs = await db.select().from(whatsappConfigTable);
    const config = configs[0];

    let externalMessageId: string | null = null;

    if (config?.phoneNumberId && config?.accessToken) {
      try {
        const waRes = await fetch(`https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message },
          }),
        });
        const waData = await waRes.json() as any;
        externalMessageId = waData?.messages?.[0]?.id || null;
      } catch (waErr) {
        console.error("WhatsApp API send error:", waErr);
      }
    }

    const [saved] = await db.insert(whatsappMessagesTable).values({
      messageId: externalMessageId,
      contactPhone: to,
      body: message,
      direction: "outbound",
      status: "sent",
    }).returning();

    res.json(saved);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/webhook", async (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const challenge = req.query["hub.challenge"];
    const token = req.query["hub.verify_token"];

    const configs = await db.select().from(whatsappConfigTable);
    const config = configs[0];

    if (mode === "subscribe" && token === config?.verifyToken) {
      res.send(challenge);
      return;
    }
    res.status(403).send("Forbidden");
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const body = req.body as any;
    if (body?.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          for (const msg of value?.messages || []) {
            const phone = msg.from;
            const text = msg.text?.body || "";
            const name = value?.contacts?.find((c: any) => c.wa_id === phone)?.profile?.name || null;
            await db.insert(whatsappMessagesTable).values({
              messageId: msg.id,
              contactPhone: phone,
              contactName: name,
              body: text,
              direction: "inbound",
              status: "received",
            });
          }
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.json({ success: true });
  }
});

router.get("/contacts", requireAuth, async (req, res) => {
  try {
    const contacts = await db.execute(sql`
      SELECT 
        contact_phone as phone,
        MAX(contact_name) as name,
        MAX(body) as "lastMessage",
        MAX(created_at) as "lastMessageAt",
        COUNT(CASE WHEN direction = 'inbound' AND status = 'received' THEN 1 END)::int as "unreadCount"
      FROM whatsapp_messages
      GROUP BY contact_phone
      ORDER BY MAX(created_at) DESC
    `);
    res.json(contacts.rows);
  } catch (err) {
    console.error("List contacts error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
