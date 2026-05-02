import { Router, type IRouter } from "express";
import { db, certificatesTable, issuersTable, verificationsTable, activityTable } from "@workspace/db";
import { eq, count, avg, sql, desc } from "drizzle-orm";
import { GetRecentActivityQueryParams, GetRecentActivityResponse, ListVerificationsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/verifications", async (req, res) => {
  const query = ListVerificationsQueryParams.parse(req.query);
  const limit = query.limit ?? 50;

  const verifications = await db
    .select()
    .from(verificationsTable)
    .orderBy(desc(verificationsTable.createdAt))
    .limit(limit);

  res.json(verifications);
});

router.get("/dashboard/stats", async (_req, res) => {
  const [certStats] = await db
    .select({
      total: count(),
      valid: sql<number>`count(*) filter (where ${certificatesTable.status} = 'valid')`,
      revoked: sql<number>`count(*) filter (where ${certificatesTable.status} = 'revoked')`,
    })
    .from(certificatesTable);

  const [issuerStats] = await db
    .select({
      total: count(),
      approved: sql<number>`count(*) filter (where ${issuersTable.status} = 'approved')`,
      pending: sql<number>`count(*) filter (where ${issuersTable.status} = 'pending')`,
    })
    .from(issuersTable);

  const [verStats] = await db
    .select({
      total: count(),
      successful: sql<number>`count(*) filter (where ${verificationsTable.result} = 'valid')`,
      avgTime: avg(verificationsTable.searchTimeMs),
      bloomHits: sql<number>`count(*) filter (where ${verificationsTable.bloomFilterHit} = true)`,
    })
    .from(verificationsTable);

  const totalVerifications = Number(verStats?.total ?? 0);
  const bloomHits = Number(verStats?.bloomHits ?? 0);
  const bloomFilterEfficiency =
    totalVerifications > 0 ? (bloomHits / totalVerifications) * 100 : 0;

  res.json({
    totalCertificates: Number(certStats?.total ?? 0),
    validCertificates: Number(certStats?.valid ?? 0),
    revokedCertificates: Number(certStats?.revoked ?? 0),
    totalIssuers: Number(issuerStats?.total ?? 0),
    approvedIssuers: Number(issuerStats?.approved ?? 0),
    pendingIssuers: Number(issuerStats?.pending ?? 0),
    totalVerifications,
    successfulVerifications: Number(verStats?.successful ?? 0),
    avgSearchTimeMs: parseFloat(String(verStats?.avgTime ?? 0)) || 0,
    bloomFilterEfficiency: parseFloat(bloomFilterEfficiency.toFixed(1)),
  });
});

router.get("/dashboard/activity", async (req, res) => {
  const query = GetRecentActivityQueryParams.parse(req.query);
  const limit = query.limit ?? 20;

  const activity = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(limit);

  res.json(activity);
});

router.get("/dashboard/verification-trend", async (_req, res) => {
  const result = await db.execute(sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*)::int as verifications,
      COUNT(*) FILTER (WHERE result = 'valid')::int as successful
    FROM verifications
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows ?? [];

  // Fill in missing days
  const trend: { date: string; verifications: number; successful: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const found = rows.find((r: any) => String(r.date).startsWith(dateStr));
    trend.push({
      date: dateStr,
      verifications: found ? Number(found.verifications) : 0,
      successful: found ? Number(found.successful) : 0,
    });
  }

  res.json(trend);
});

export default router;
