import { pgTable, serial, text, integer, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { issuersTable } from "./issuers";

export const certificateStatusEnum = pgEnum("certificate_status", [
  "valid",
  "revoked",
  "expired",
]);

export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  certificateHash: text("certificate_hash").notNull().unique(),
  holderName: text("holder_name").notNull(),
  holderEmail: text("holder_email").notNull(),
  issuerId: integer("issuer_id")
    .notNull()
    .references(() => issuersTable.id),
  degree: text("degree").notNull(),
  field: text("field").notNull(),
  grade: text("grade").notNull(),
  issuedDate: date("issued_date").notNull(),
  expiryDate: date("expiry_date"),
  status: certificateStatusEnum("status").notNull().default("valid"),
  transactionHash: text("transaction_hash").notNull(),
  blockNumber: integer("block_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCertificateSchema = createInsertSchema(certificatesTable).omit({
  id: true,
  certificateHash: true,
  transactionHash: true,
  blockNumber: true,
  createdAt: true,
});

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificatesTable.$inferSelect;
