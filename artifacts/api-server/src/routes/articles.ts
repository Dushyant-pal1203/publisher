import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, ilike, and, sql } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import {
  CreateArticleBody,
  UpdateArticleBody,
  ListArticlesQueryParams,
  GetArticleParams,
  UpdateArticleParams,
  DeleteArticleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(row: typeof articlesTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    type: row.type,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    coverImageUrl: row.coverImageUrl,
    category: row.category,
    isbn: row.isbn,
    publishedYear: row.publishedYear,
    pageCount: row.pageCount,
    language: row.language,
    publisher: row.publisher,
    inStock: row.inStock,
    featured: row.featured,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt as unknown as string).toISOString(),
  };
}

router.get("/articles", async (req: Request, res: Response) => {
  const parsed = ListArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { type, search, featured } = parsed.data;
  const conditions = [];
  if (type) conditions.push(eq(articlesTable.type, type));
  if (typeof featured === "boolean") conditions.push(eq(articlesTable.featured, featured));
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      sql`(${articlesTable.title} ILIKE ${term} OR ${articlesTable.author} ILIKE ${term} OR ${articlesTable.description} ILIKE ${term})`,
    );
  }
  const rows = await db
    .select()
    .from(articlesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(articlesTable.createdAt));
  res.json(rows.map(serialize));
});

router.get("/articles/:id", async (req: Request, res: Response) => {
  const parsed = GetArticleParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, parsed.data.id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json(serialize(row));
});

router.post("/articles", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid article data" });
    return;
  }
  const data = parsed.data;
  const [row] = await db
    .insert(articlesTable)
    .values({
      title: data.title,
      author: data.author,
      type: data.type,
      description: data.description ?? "",
      price: String(data.price),
      currency: data.currency ?? "INR",
      coverImageUrl: data.coverImageUrl ?? null,
      category: data.category ?? null,
      isbn: data.isbn ?? null,
      publishedYear: data.publishedYear ?? null,
      pageCount: data.pageCount ?? null,
      language: data.language ?? null,
      publisher: data.publisher ?? null,
      inStock: data.inStock ?? true,
      featured: data.featured ?? false,
    })
    .returning();
  res.status(201).json(serialize(row));
});

router.patch("/articles/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const idParsed = UpdateArticleParams.safeParse(req.params);
  if (!idParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid article data" });
    return;
  }
  const data = parsed.data;
  const [row] = await db
    .update(articlesTable)
    .set({
      title: data.title,
      author: data.author,
      type: data.type,
      description: data.description ?? "",
      price: String(data.price),
      currency: data.currency ?? "INR",
      coverImageUrl: data.coverImageUrl ?? null,
      category: data.category ?? null,
      isbn: data.isbn ?? null,
      publishedYear: data.publishedYear ?? null,
      pageCount: data.pageCount ?? null,
      language: data.language ?? null,
      publisher: data.publisher ?? null,
      inStock: data.inStock ?? true,
      featured: data.featured ?? false,
    })
    .where(eq(articlesTable.id, idParsed.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/articles/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = DeleteArticleParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(articlesTable).where(eq(articlesTable.id, parsed.data.id));
  res.status(204).end();
});

router.get("/catalog/summary", async (_req: Request, res: Response) => {
  const all = await db.select().from(articlesTable);
  const byTypeMap = new Map<string, number>();
  for (const row of all) {
    byTypeMap.set(row.type, (byTypeMap.get(row.type) ?? 0) + 1);
  }
  const byType = Array.from(byTypeMap.entries()).map(([type, count]) => ({
    type,
    count,
  }));
  const featured = all.filter((r) => r.featured).slice(0, 6).map(serialize);
  const latest = [...all]
    .sort((a, b) => {
      const aT = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bT = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bT - aT;
    })
    .slice(0, 6)
    .map(serialize);
  res.json({
    totalArticles: all.length,
    byType,
    featured,
    latest,
  });
});

export default router;
