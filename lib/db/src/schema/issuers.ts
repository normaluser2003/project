import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const issuerTypeEnum = pgEnum("issuer_type", [
  "university",
  "college",
  "school",
  "organization",
  "government",
]);

export const issuerStatusEnum = pgEnum("issuer_status", [
  "pending",
  "approved",
  "rejected",
]);

export const issuersTable = pgTable("issuers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: issuerTypeEnum("type").notNull(),
  country: text("country").notNull(),
  address: text("address").notNull(),
  publicKeyHash: text("public_key_hash").notNull(),
  passwordHash: text("password_hash"),
  status: issuerStatusEnum("status").notNull().default("pending"),
  votesFor: integer("votes_for").notNull().default(0),
  votesAgainst: integer("votes_against").notNull().default(0),
  totalCertificates: integer("total_certificates").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIssuerSchema = createInsertSchema(issuersTable).omit({
  id: true,
  publicKeyHash: true,
  votesFor: true,
  votesAgainst: true,
  totalCertificates: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIssuer = z.infer<typeof insertIssuerSchema>;
export type Issuer = typeof issuersTable.$inferSelect;
