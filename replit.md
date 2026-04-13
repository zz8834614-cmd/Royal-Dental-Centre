# Royal Dental Centre

## Overview

A comprehensive dental clinic management platform built as a pnpm workspace monorepo. Supports 4 user roles (patient, doctor, admin, receptionist), appointment booking, medical records, smart prescriptions with PDF/print and quantity field, medication database, chat messaging, reviews, notifications, site settings, and bilingual Arabic/English support with RTL.

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

## User Roles & Credentials (Auto-seeded on startup)

- **Admin**: admin@royal.com / Admin@2024
- **Doctor**: doctor@royal.com / Doctor@2024
- **Receptionist**: reception@royal.com / Reception@2024
- **Patient**: Register via /register page

Auto-seed runs on every server start (`seed.ts`). Creates default admin/doctor/receptionist accounts if they don't exist yet. Works in both dev and production environments.

## Features

- Public landing page with centered text hero and realistic 3D molar tooth SVG below (floating animation)
- Public Services page (/services) — lists all dental services with prices
- Public Reviews page (/reviews) — shows patient reviews with star ratings
- Public Contact page (/contact) — phone, email, address, WhatsApp link
- About Us page (/about) with mission, vision, values, team, working hours
- WhatsApp floating chat button on public pages (wa.me/213699790790)
- Profile editing for all roles (name, phone)
- Patient portal: appointments (book/cancel), medical records, prescriptions with print/PDF, reviews, chat
- Doctor portal: patient directory with medical record management (view/add records), prescriptions with smart medication search and print/PDF, medication database CRUD, appointments management, chat
- Admin panel: dashboard with stats/charts, services CRUD, team management, patient management (view/edit), announcements with image support, appointments management, chat, site settings (phone, email, address, about us, working hours)
- Smart prescription builder: medication search from database, auto-add to prescription, printable PDF with clinic branding
- Medication database management with categories (antibiotic, painkiller, etc.)
- Smart booking system with service selection, doctor selection, available time slots
- Chat/messaging system between patients and doctors
- Notification system (notifications table + API)
- Site settings stored in database (clinic phone, email, address, working hours, about us content)
- Announcements with image URL support
- Star rating system for service reviews
- Dark/light mode toggle (dark default)
- Arabic/English language toggle with RTL support (Arabic default)
- All pages fully bilingual (Arabic/English)
- Glass morphism cards for services, reviews, announcements
- Professional Lucide SVG icons (no emojis)

## Auth System

- Token stored in `localStorage` as `royal_dental_token` (plain user ID)
- Sent as `x-user-id` header via `custom-fetch.ts`
- Login redirects to `/{role}/dashboard`

## Route Structure

### Public Routes
- `/` — Landing page
- `/services` — Services listing
- `/news` — News & Offers (from announcements)
- `/about` — About Us
- `/reviews` — Patient reviews
- `/contact` — Contact information
- `/login` — Login form
- `/register` — Registration form

### Patient Routes (role: patient)
- `/patient/dashboard` — Patient dashboard
- `/patient/appointments` — Appointment booking (service/doctor/slot selection) & history with cancel
- `/patient/records` — Medical records (bilingual)
- `/patient/prescriptions` — Prescriptions with print/PDF
- `/patient/reviews` — Submit/view reviews
- `/patient/chat` — Chat with doctors
- `/patient/profile` — Edit name, phone

### Doctor Routes (role: doctor)
- `/doctor/dashboard` — Doctor dashboard with analytics
- `/doctor/patients` — Patient directory with medical record creation
- `/doctor/appointments` — Manage appointments (confirm/complete/cancel)
- `/doctor/prescriptions` — Smart prescription builder (medication search, quantity field, print, edit, delete)
- `/doctor/medications` — Medication database CRUD with categories
- `/doctor/services` — Services management
- `/doctor/chat` — Chat with patients
- `/doctor/profile` — Edit name, phone

### Admin Routes (role: admin)
- `/admin/dashboard` — Admin dashboard with stats, charts, activity
- `/admin/patients` — Patient management (view/edit patient info, view records)
- `/admin/services` — CRUD services with bilingual names/descriptions/prices
- `/admin/team` — User list with role management (assign receptionist role)
- `/admin/appointments` — Manage all appointments
- `/admin/prescriptions` — View/edit/delete all prescriptions across all doctors
- `/admin/announcements` — Create/delete announcements with images
- `/admin/chat` — Chat with patients/doctors
- `/admin/settings` — Site settings (phone, email, address, about us, working hours)
- `/admin/profile` — Edit name, phone

### Receptionist Routes (role: receptionist)
- `/receptionist/dashboard` — Reception overview (pending/confirmed counts, today's queue)
- `/receptionist/queue` — Queue management: accept/reject pending appointments, reorder queue, toggle patient subscription, close schedule
- `/receptionist/profile` — Edit name, phone

## Database Schema

Tables: users, services, appointments, medical_records, medications, prescriptions, conversations, messages, announcements (with image_url), reviews, notifications, site_settings

## i18n

All translations in `artifacts/dental-clinic/src/lib/i18n.tsx`. Keys organized by prefix:
- `nav.*` — Navigation labels
- `auth.*` — Authentication forms
- `admin.*` — Admin panel labels
- `hero.*` — Hero section
- `services.*`, `reviews.*`, `contact.*` — Public page content

Default language: Arabic. Default theme: Dark.
