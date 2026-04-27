import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(row: typeof settingsTable.$inferSelect) {
  return {
    publisherName: row.publisherName,
    tagline: row.tagline,
    about: row.about,
    whatsappNumber: row.whatsappNumber,
    contactEmail: row.contactEmail,
    contactAddress: row.contactAddress,
    currency: row.currency,
    upiId: row.upiId,
    bankDetails: row.bankDetails,
    paymentInstructions: row.paymentInstructions,
  };
}

async function getOrCreateSettings() {
  const existing = await db.select().from(settingsTable).limit(1);
  if (existing.length > 0) return existing[0];
  const [row] = await db.insert(settingsTable).values({}).returning();
  return row;
}

router.get("/settings", async (_req: Request, res: Response) => {
  const row = await getOrCreateSettings();
  res.json(serialize(row));
});

router.put("/settings", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid settings" });
    return;
  }
  const data = parsed.data;
  const current = await getOrCreateSettings();
  const [row] = await db
    .update(settingsTable)
    .set({
      publisherName: data.publisherName,
      tagline: data.tagline ?? null,
      about: data.about ?? null,
      whatsappNumber: data.whatsappNumber,
      contactEmail: data.contactEmail ?? null,
      contactAddress: data.contactAddress ?? null,
      currency: data.currency,
      upiId: data.upiId ?? null,
      bankDetails: data.bankDetails ?? null,
      paymentInstructions: data.paymentInstructions ?? null,
    })
    .where(eq(settingsTable.id, current.id))
    .returning();
  res.json(serialize(row));
});

export default router;
