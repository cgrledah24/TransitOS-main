# Transit Manager

## Overview

Full-stack transport operations management platform with admin and driver roles, calendar-based trip management, WhatsApp Business API integration, and analytics dashboards.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/transit-manager)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Charts**: Recharts
- **Forms**: react-hook-form + @hookform/resolvers
- **Animations**: framer-motion
- **Icons**: Lucide React

## Authentication

- **Admin**: username=`admin`, password=`Admin77777`
- **Driver sample accounts**: `carlos.mendez`, `mario.garcia`, `ana.lopez` (all with password `Admin77777`)
- JWT tokens stored in localStorage under key `transit_token`
- Roles: `admin` (full access) and `driver` (restricted to own trips)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   ├── src/lib/auth.ts # JWT + bcrypt auth helpers
│   │   └── src/routes/     # auth, users, trips, whatsapp
│   └── transit-manager/    # React + Vite frontend (served at /)
│       └── src/pages/      # login, dashboard, calendar, trips, drivers, whatsapp, settings
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/     # users, trips, whatsapp tables
└── scripts/
```

## Features

1. **RBAC Authentication**: JWT-based auth. Admin and Driver roles. Password validation.
2. **Calendar Module**: Monthly calendar view. Admin sees all trips, drivers see only theirs.
3. **Trip Management**: Create/edit/delete trips (admin). View own trips (driver). Status tracking.
4. **Dashboard & KPIs**: Trip counts, revenue totals, bar charts by driver, monthly trends.
5. **Driver Management**: Admin can manage driver accounts.
6. **WhatsApp Integration**: Message inbox, send messages, webhook receiver for incoming messages, config panel.
7. **Settings**: Users can change their own password.

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (auto-provisioned by Replit)
- `JWT_SECRET` - JWT signing secret (defaults to built-in value, set in env for production)
- `PORT` - Server port (auto-assigned)

## Database Tables

- `users` - User accounts (admin/driver roles)
- `trips` - Transit records with date, origin, destination, driver, amount, status
- `whatsapp_config` - WhatsApp API credentials
- `whatsapp_messages` - Incoming/outgoing WhatsApp messages

## API Endpoints

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `GET/POST /api/users` - User management (admin)
- `GET/POST/PUT/DELETE /api/trips` - Trip management
- `GET /api/trips/stats` - Analytics stats
- `GET/PUT /api/whatsapp/config` - WhatsApp config (admin)
- `GET/POST /api/whatsapp/messages` - Messages
- `GET /api/whatsapp/contacts` - Unique contacts
- `GET/POST /api/whatsapp/webhook` - Webhook for incoming messages
