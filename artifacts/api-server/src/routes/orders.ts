import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, articlesTable } from "@workspace/db";
import {
  CreateOrderBody,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  DeleteOrderParams,
  ListOrdersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(row: typeof ordersTable.$inferSelect) {
  return {
    id: row.id,
    articleId: row.articleId,
    articleTitle: row.articleTitle,
    articleAuthor: row.articleAuthor,
    quantity: row.quantity,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    customerAddress: row.customerAddress,
    paymentMethod: row.paymentMethod,
    status: row.status,
    totalAmount: Number(row.totalAmount),
    currency: row.currency,
    notes: row.notes,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt as unknown as string).toISOString(),
  };
}

router.get("/orders", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const rows = parsed.data.status
    ? await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.status, parsed.data.status))
        .orderBy(desc(ordersTable.createdAt))
    : await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(rows.map(serialize));
});

router.post("/orders", async (req: Request, res: Response) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid order data" });
    return;
  }
  const data = parsed.data;
  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, data.articleId))
    .limit(1);
  if (!article) {
    res.status(400).json({ error: "Article not found" });
    return;
  }
  const total = Number(article.price) * data.quantity;
  const [row] = await db
    .insert(ordersTable)
    .values({
      articleId: article.id,
      articleTitle: article.title,
      articleAuthor: article.author,
      quantity: data.quantity,
      customerName: data.customerName,
      customerEmail: data.customerEmail ?? null,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      paymentMethod: data.paymentMethod,
      status: "pending",
      totalAmount: String(total),
      currency: article.currency,
      notes: data.notes ?? null,
    })
    .returning();
  res.status(201).json(serialize(row));
});

router.patch("/orders/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const idParsed = UpdateOrderStatusParams.safeParse(req.params);
  if (!idParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const [row] = await db
    .update(ordersTable)
    .set({ status: bodyParsed.data.status })
    .where(eq(ordersTable.id, idParsed.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/orders/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = DeleteOrderParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(ordersTable).where(eq(ordersTable.id, parsed.data.id));
  res.status(204).end();
});

router.get("/orders/summary", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const all = await db.select().from(ordersTable);
  const byStatusMap = new Map<string, number>();
  let revenue = 0;
  let pending = 0;
  for (const row of all) {
    byStatusMap.set(row.status, (byStatusMap.get(row.status) ?? 0) + 1);
    revenue += Number(row.totalAmount);
    if (row.status === "pending") pending += 1;
  }
  const recent = [...all]
    .sort((a, b) => {
      const aT = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bT = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bT - aT;
    })
    .slice(0, 5)
    .map(serialize);
  res.json({
    totalOrders: all.length,
    pendingOrders: pending,
    totalRevenue: revenue,
    byStatus: Array.from(byStatusMap.entries()).map(([status, count]) => ({
      status,
      count,
    })),
    recent,
  });
});

export default router;
