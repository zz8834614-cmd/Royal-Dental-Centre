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
- **Arabic font**: Noto Naskh Arabic (Google Fonts)

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

- Public landing page with centered text hero and realistic 3D molar tooth SVG below (floating animation with dental tools)
- Public Services page (/services) — lists all dental services with prices
- Public Reviews page (/reviews) — shows patient reviews with star ratings
- Public Contact page (/contact) — phone, email, address, WhatsApp link
- About Us page (/about) with mission, vision, values, team, working hours
- WhatsApp floating chat button on public pages (wa.me/213699790790)
- Patient portal: appointments, medical records, prescriptions, reviews
- Doctor dashboard: patient management, prescriptions, appointments, analytics charts
- Admin panel: dashboard with stats/charts, services CRUD, team management (role changes), announcements CRUD, appointments management
- Smart prescription builder with medication database search
- Star rating system for service reviews
- Dark/light mode toggle (dark default)
- Arabic/English language toggle with RTL support (Arabic default)
- Glass morphism cards for services, reviews, announcements
- Navbar with dropdown menus (no logo, text name only)
- Professional Lucide SVG icons (no emojis)

## Auth System

- Token stored in `localStorage` as `royal_dental_token` (plain user ID)
- Sent as `x-user-id` header via `custom-fetch.ts`
- Login redirects to `/{role}/dashboard`

## Route Structure

### Public Routes
- `/` — Landing page
- `/about` — About Us
- `/services` — Services listing
- `/reviews` — Patient reviews
- `/contact` — Contact information
- `/login` — Login form
- `/register` — Registration form

### Patient Routes (role: patient)
- `/patient/dashboard` — Patient dashboard
- `/patient/appointments` — Appointment booking & history
- `/patient/records` — Medical records
- `/patient/prescriptions` — Prescriptions
- `/patient/reviews` — Submit/view reviews

### Doctor Routes (role: doctor)
- `/doctor/dashboard` — Doctor dashboard with analytics
- `/doctor/patients` — Patient list
- `/doctor/appointments` — Manage appointments
- `/doctor/prescriptions` — Manage prescriptions
- `/doctor/services` — Services management (shared with admin)

### Admin Routes (role: admin)
- `/admin/dashboard` — Admin dashboard with stats, charts, activity
- `/admin/services` — CRUD services with bilingual names/descriptions/prices
- `/admin/team` — User list with role management (admin/doctor/patient)
- `/admin/appointments` — Manage all appointments
- `/admin/announcements` — Create/delete announcements

## Database Schema

Tables: users, services, appointments, medical_records, medications, prescriptions, conversations, messages, announcements, reviews, notifications

## i18n

All translations in `artifacts/dental-clinic/src/lib/i18n.tsx`. Keys organized by prefix:
- `nav.*` — Navigation labels
- `auth.*` — Authentication forms
- `admin.*` — Admin panel labels
- `hero.*` — Hero section
- `services.*`, `reviews.*`, `contact.*` — Public page content

Default language: Arabic. Default theme: Dark.
