import { pgTable, serial, text, integer, timestamp, real, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verificationResultEnum = pgEnum("verification_result", [
  "valid",
  "revoked",
  "not_found",
]);

export const verificationsTable = pgTable("verifications", {
  id: serial("id").primaryKey(),
  certificateHash: text("certificate_hash").notNull(),
  verifierName: text("verifier_name").notNull(),
  verifierOrganization: text("verifier_organization").notNull(),
  result: verificationResultEnum("result").notNull(),
  searchTimeMs: real("search_time_ms").notNull(),
  bloomFilterHit: boolean("bloom_filter_hit").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVerificationSchema = createInsertSchema(verificationsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type Verification = typeof verificationsTable.$inferSelect;
