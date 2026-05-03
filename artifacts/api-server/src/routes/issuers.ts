import { Router, type IRouter } from "express";
import { db, issuersTable, activityTable } from "@workspace/db";
import {
  ListIssuersQueryParams,
  CreateIssuerBody,
  UpdateIssuerStatusBody,
  VoteOnIssuerBody,
} from "@workspace/api-zod";
import { eq, ilike, or } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "Abcd@123";

const router: IRouter = Router();

router.get("/issuers", async (req, res) => {
  const query = ListIssuersQueryParams.parse(req.query);

  let dbQuery = db.select().from(issuersTable).$dynamic();

  if (query.status) {
    dbQuery = dbQuery.where(eq(issuersTable.status, query.status));
  } else if (query.search) {
    dbQuery = dbQuery.where(
      or(
        ilike(issuersTable.name, `%${query.search}%`),
        ilike(issuersTable.country, `%${query.search}%`)
      )
    );
  }

  const issuers = await dbQuery.orderBy(issuersTable.createdAt);
  res.json(issuers);
});

router.post("/issuers", async (req, res) => {
  const body = CreateIssuerBody.parse(req.body);

  const publicKeyHash = crypto
    .createHash("sha256")
    .update(`${body.name}:${body.address}:${Date.now()}`)
    .digest("hex");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const [issuer] = await db
    .insert(issuersTable)
    .values({
      ...body,
      publicKeyHash,
      passwordHash,
      status: "pending",
      votesFor: 0,
      votesAgainst: 0,
      totalCertificates: 0,
    })
    .returning();

  await db.insert(activityTable).values({
    type: "issuer_registered",
    description: `New issuer "${issuer.name}" submitted for validation`,
    entityName: issuer.name,
  });

  res.status(201).json(issuer);
});

router.get("/issuers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [issuer] = await db
    .select()
    .from(issuersTable)
    .where(eq(issuersTable.id, id));

  if (!issuer) {
    res.status(404).json({ error: "Issuer not found" });
    return;
  }

  res.json(issuer);
});

router.patch("/issuers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateIssuerStatusBody.parse(req.body);

  const [issuer] = await db
    .update(issuersTable)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(issuersTable.id, id))
    .returning();

  if (!issuer) {
    res.status(404).json({ error: "Issuer not found" });
    return;
  }

  await db.insert(activityTable).values({
    type: body.status === "approved" ? "issuer_approved" : "issuer_rejected",
    description: `Issuer "${issuer.name}" was ${body.status}`,
    entityName: issuer.name,
  });

  res.json(issuer);
});

router.post("/issuers/:id/vote", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = VoteOnIssuerBody.parse(req.body);

  const [existing] = await db
    .select()
    .from(issuersTable)
    .where(eq(issuersTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Issuer not found" });
    return;
  }

  const newVotesFor =
    existing.votesFor + (body.vote === "approve" ? 1 : 0);
  const newVotesAgainst =
    existing.votesAgainst + (body.vote === "reject" ? 1 : 0);

  // Auto-approve if 3+ votes for, auto-reject if 2+ votes against
  let newStatus = existing.status;
  if (newVotesFor >= 3 && existing.status === "pending") {
    newStatus = "approved";
  } else if (newVotesAgainst >= 2 && existing.status === "pending") {
    newStatus = "rejected";
  }

  const [issuer] = await db
    .update(issuersTable)
    .set({
      votesFor: newVotesFor,
      votesAgainst: newVotesAgainst,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(issuersTable.id, id))
    .returning();

  await db.insert(activityTable).values({
    type: "vote_cast",
    description: `${body.validatorName} voted to ${body.vote} issuer "${issuer.name}"`,
    entityName: issuer.name,
  });

  if (newStatus !== existing.status) {
    await db.insert(activityTable).values({
      type: newStatus === "approved" ? "issuer_approved" : "issuer_rejected",
      description: `Issuer "${issuer.name}" automatically ${newStatus} by voting consensus`,
      entityName: issuer.name,
    });
  }

  res.json(issuer);
});

export default router;
