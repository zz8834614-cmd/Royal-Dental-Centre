# Royal Dental Centre

## Overview

A comprehensive dental clinic management platform built as a pnpm workspace monorepo. Supports 3 user roles (patient, doctor, admin), appointment booking, medical records, prescriptions, chat messaging, reviews, and bilingual Arabic/English support.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Routing**: wouter
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## User Roles & Credentials (Seed Data)

- **Doctor**: doctor@royal.com / doctor123
- **Patient**: patient@royal.com / patient123
- **Admin**: admin@royal.com / admin123

## Features

- Public landing page with services, reviews, announcements
- About Us page (من نحن) with mission, vision, values, team, working hours
- WhatsApp floating chat button on public pages (opens wa.me link)
- Patient portal: appointments, medical records, prescriptions, chat, reviews
- Doctor dashboard: patient management, prescriptions, medications, analytics charts
- Admin panel: bookings, announcements, daily stats
- Smart prescription builder with medication database search
- Star rating system for service reviews
- Dark/light mode toggle with full theme support
- Arabic/English language toggle with RTL support
- 3D animated hero section with floating tooth, golden crown, particles
- Glass morphism (glassmorphism) cards for services, reviews, announcements
- Notification system for appointment confirmations and reminders

## Database Schema

Tables: users, services, appointments, medical_records, medications, prescriptions, conversations, messages, announcements, reviews, notifications

## API Auth

Simple token-based auth using user ID in `x-user-id` header. Login returns user ID as token, stored client-side.
