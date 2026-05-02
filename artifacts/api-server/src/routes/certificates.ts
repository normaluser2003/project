import { Router, type IRouter } from "express";
import { db, certificatesTable, issuersTable, verificationsTable, activityTable } from "@workspace/db";
import {
  ListCertificatesQueryParams,
  IssueCertificateBody,
  UpdateCertificateStatusBody,
  VerifyCertificateBody,
} from "@workspace/api-zod";
import { eq, and, ilike, or } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

// Simulated Bloom Filter - in memory set of hashes for fast negative lookup
const bloomFilterSet = new Set<string>();

function bloomFilterHit(hash: string): boolean {
  return bloomFilterSet.has(hash.substring(0, 16));
}

function addToBloomFilter(hash: string) {
  bloomFilterSet.add(hash.substring(0, 16));
}

function generateCertificateHash(data: {
  holderName: string;
  holderEmail: string;
  issuerId: number;
  degree: string;
  field: string;
  issuedDate: string;
}): string {
  const payload = JSON.stringify(data) + Date.now();
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function generateTransactionHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

function generateBlockNumber(): number {
  return Math.floor(18000000 + Math.random() * 2000000);
}

router.get("/certificates", async (req, res) => {
  const query = ListCertificatesQueryParams.parse(req.query);

  let dbQuery = db
    .select({
      id: certificatesTable.id,
      certificateHash: certificatesTable.certificateHash,
      holderName: certificatesTable.holderName,
      holderEmail: certificatesTable.holderEmail,
      issuerId: certificatesTable.issuerId,
      issuerName: issuersTable.name,
      degree: certificatesTable.degree,
      field: certificatesTable.field,
      grade: certificatesTable.grade,
      issuedDate: certificatesTable.issuedDate,
      expiryDate: certificatesTable.expiryDate,
      status: certificatesTable.status,
      transactionHash: certificatesTable.transactionHash,
      blockNumber: certificatesTable.blockNumber,
      createdAt: certificatesTable.createdAt,
    })
    .from(certificatesTable)
    .leftJoin(issuersTable, eq(certificatesTable.issuerId, issuersTable.id))
    .$dynamic();

  const conditions = [];
  if (query.issuerId) {
    conditions.push(eq(certificatesTable.issuerId, query.issuerId));
  }
  if (query.status) {
    conditions.push(eq(certificatesTable.status, query.status));
  }
  if (query.search) {
    conditions.push(
      or(
        ilike(certificatesTable.holderName, `%${query.search}%`),
        ilike(certificatesTable.holderEmail, `%${query.search}%`),
        ilike(certificatesTable.degree, `%${query.search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    dbQuery = dbQuery.where(and(...conditions));
  }

  const certs = await dbQuery.orderBy(certificatesTable.createdAt);
  res.json(certs);
});

router.post("/certificates", async (req, res) => {
  const body = IssueCertificateBody.parse(req.body);

  // Verify issuer is approved
  const [issuer] = await db
    .select()
    .from(issuersTable)
    .where(eq(issuersTable.id, body.issuerId));

  if (!issuer || issuer.status !== "approved") {
    res.status(400).json({ error: "Issuer is not approved to issue certificates" });
    return;
  }

  const certificateHash = generateCertificateHash({
    holderName: body.holderName,
    holderEmail: body.holderEmail,
    issuerId: body.issuerId,
    degree: body.degree,
    field: body.field,
    issuedDate: body.issuedDate,
  });

  const transactionHash = generateTransactionHash();
  const blockNumber = generateBlockNumber();

  const [cert] = await db
    .insert(certificatesTable)
    .values({
      certificateHash,
      holderName: body.holderName,
      holderEmail: body.holderEmail,
      issuerId: body.issuerId,
      degree: body.degree,
      field: body.field,
      grade: body.grade,
      issuedDate: body.issuedDate,
      expiryDate: body.expiryDate ?? null,
      status: "valid",
      transactionHash,
      blockNumber,
    })
    .returning();

  // Update issuer certificate count
  await db
    .update(issuersTable)
    .set({ totalCertificates: issuer.totalCertificates + 1 })
    .where(eq(issuersTable.id, body.issuerId));

  addToBloomFilter(certificateHash);

  await db.insert(activityTable).values({
    type: "certificate_issued",
    description: `Certificate issued to ${body.holderName} by ${issuer.name}`,
    entityName: body.holderName,
  });

  res.status(201).json({ ...cert, issuerName: issuer.name });
});

router.get("/certificates/verify", async (req, res) => {
  res.status(405).json({ error: "Use POST /certificates/verify" });
});

router.post("/certificates/verify", async (req, res) => {
  const body = VerifyCertificateBody.parse(req.body);
  const startTime = Date.now();

  // Bloom filter check first (fast negative detection)
  const inBloom = bloomFilterHit(body.certificateHash);

  let result: "valid" | "revoked" | "not_found" = "not_found";
  let certificate = null;

  if (inBloom || body.certificateHash.length === 64) {
    // Do full DB lookup
    const rows = await db
      .select({
        id: certificatesTable.id,
        certificateHash: certificatesTable.certificateHash,
        holderName: certificatesTable.holderName,
        holderEmail: certificatesTable.holderEmail,
        issuerId: certificatesTable.issuerId,
        issuerName: issuersTable.name,
        degree: certificatesTable.degree,
        field: certificatesTable.field,
        grade: certificatesTable.grade,
        issuedDate: certificatesTable.issuedDate,
        expiryDate: certificatesTable.expiryDate,
        status: certificatesTable.status,
        transactionHash: certificatesTable.transactionHash,
        blockNumber: certificatesTable.blockNumber,
        createdAt: certificatesTable.createdAt,
      })
      .from(certificatesTable)
      .leftJoin(issuersTable, eq(certificatesTable.issuerId, issuersTable.id))
      .where(eq(certificatesTable.certificateHash, body.certificateHash));

    if (rows.length > 0) {
      certificate = rows[0];
      result = certificate.status === "revoked" ? "revoked" : "valid";
    }
  }

  const searchTimeMs = Date.now() - startTime;

  await db.insert(verificationsTable).values({
    certificateHash: body.certificateHash,
    verifierName: body.verifierName,
    verifierOrganization: body.verifierOrganization,
    result,
    searchTimeMs,
    bloomFilterHit: inBloom,
  });

  if (result !== "not_found") {
    await db.insert(activityTable).values({
      type: result === "valid" ? "verification_success" : "verification_failed",
      description: `${body.verifierName} verified certificate for ${certificate?.holderName ?? "unknown"} — ${result}`,
      entityName: body.verifierName,
    });
  }

  res.json({
    found: result !== "not_found",
    valid: result === "valid",
    certificate: certificate ?? null,
    searchTimeMs,
    bloomFilterHit: inBloom,
    message:
      result === "valid"
        ? "Certificate is authentic and valid"
        : result === "revoked"
        ? "Certificate has been revoked"
        : "Certificate not found in blockchain registry",
  });
});

router.get("/certificates/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const rows = await db
    .select({
      id: certificatesTable.id,
      certificateHash: certificatesTable.certificateHash,
      holderName: certificatesTable.holderName,
      holderEmail: certificatesTable.holderEmail,
      issuerId: certificatesTable.issuerId,
      issuerName: issuersTable.name,
      degree: certificatesTable.degree,
      field: certificatesTable.field,
      grade: certificatesTable.grade,
      issuedDate: certificatesTable.issuedDate,
      expiryDate: certificatesTable.expiryDate,
      status: certificatesTable.status,
      transactionHash: certificatesTable.transactionHash,
      blockNumber: certificatesTable.blockNumber,
      createdAt: certificatesTable.createdAt,
    })
    .from(certificatesTable)
    .leftJoin(issuersTable, eq(certificatesTable.issuerId, issuersTable.id))
    .where(eq(certificatesTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "Certificate not found" });
    return;
  }

  res.json(rows[0]);
});

router.patch("/certificates/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateCertificateStatusBody.parse(req.body);

  const [cert] = await db
    .update(certificatesTable)
    .set({ status: body.status })
    .where(eq(certificatesTable.id, id))
    .returning();

  if (!cert) {
    res.status(404).json({ error: "Certificate not found" });
    return;
  }

  await db.insert(activityTable).values({
    type: "certificate_revoked",
    description: `Certificate for ${cert.holderName} was revoked`,
    entityName: cert.holderName,
  });

  // Get issuer name for response
  const [issuer] = await db
    .select()
    .from(issuersTable)
    .where(eq(issuersTable.id, cert.issuerId));

  res.json({ ...cert, issuerName: issuer?.name ?? "Unknown" });
});

export { addToBloomFilter };
export default router;
