# CertChain — Blockchain Certificate Authentication Platform

## Overview

A full-stack web platform implementing blockchain-based certificate authentication and issuer validation, based on the research paper "A Faster, Integrated, and Trusted Certificate Authentication and Issuer Validation System Based on Blockchain" (IEEE ACCESS, 2025).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/certchain) — served at `/`
- **API framework**: Express 5 (artifacts/api-server) — served at `/api`
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Features

- **Certificate Issuance**: Approved issuers can issue tamper-proof certificates with cryptographic hashes stored on a simulated Ethereum blockchain (SHA-256 hash + transaction hash + block number)
- **Hash-based Verification**: Employers/verifiers can verify certificate authenticity by pasting a certificate hash — returns result in milliseconds using Bloom Filter optimization
- **Issuer Validation**: Decentralized voting mechanism — validators vote to approve/reject institutions. Auto-approves at 3+ votes, auto-rejects at 2+ against
- **System Dashboard**: Real-time stats, Bloom Filter efficiency metrics, 7-day verification trend chart, recent activity feed
- **Certificate Registry**: Full CRUD — issue, search, filter, revoke certificates
- **Issuer Management**: Register institutions, vote on pending issuers, manage approved/rejected institutions

## Pages

- `/` — Landing page with platform overview
- `/dashboard` — System dashboard with live stats and charts
- `/verify` — Certificate verification via hash lookup
- `/certificates` — Certificate registry (issue/revoke/browse)
- `/issuers` — Issuer management and voting

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## DB Schema

- `issuers` — Certificate-issuing institutions with status (pending/approved/rejected) and vote counts
- `certificates` — Issued certificates with SHA-256 hash, holder info, issuer ref, blockchain tx details
- `verifications` — Log of all verification attempts with search time and Bloom Filter hit status
- `activity` — Activity feed for recent system events

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
