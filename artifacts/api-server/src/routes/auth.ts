import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, issuersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/auth/login", async (req, res) => {
  const { issuerId, password } = req.body ?? {};
  if (!issuerId || typeof password !== "string" || !password) {
    res.status(400).json({ error: "issuerId and password are required" });
    return;
  }

  const [issuer] = await db
    .select()
    .from(issuersTable)
    .where(eq(issuersTable.id, issuerId));

  if (!issuer) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (!issuer.passwordHash) {
    res.status(401).json({ error: "Account not set up. Contact administrator." });
    return;
  }

  const valid = await bcrypt.compare(password, issuer.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  (req.session as any).issuerId = issuer.id;
  (req.session as any).issuerName = issuer.name;

  res.json({
    id: issuer.id,
    name: issuer.name,
    type: issuer.type,
    country: issuer.country,
    status: issuer.status,
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res) => {
  const issuerId = (req.session as any).issuerId;
  if (!issuerId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [issuer] = await db
    .select()
    .from(issuersTable)
    .where(eq(issuersTable.id, issuerId));

  if (!issuer) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    id: issuer.id,
    name: issuer.name,
    type: issuer.type,
    country: issuer.country,
    status: issuer.status,
  });
});

export default router;
