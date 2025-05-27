# 🏫 SchoolScope: Local Development Setup Guide

A crowdsourced calendar + wiki-style app for Australian schools using:
- Next.js 14 App Router
- Tailwind + ShadCN
- Prisma + PostgreSQL (local)
- Lucia Auth

---

## 💡 What SchoolScope Does

**SchoolScope** is a platform for Australian parents, students, and teachers to:

- 📚 View and edit **school profiles** (type, location, year levels, contacts)
- 🗓️ Explore a **calendar of school events** (excursions, parent nights, holidays, etc.)
- 🏷️ Filter events by **year level**, category, and confirmed/unconfirmed status
- 👨‍👩‍👧‍👦 Create a **personal profile** linked to children (with year + school info)
- 📌 Select your **child's school and year** to instantly see what's coming up
- ✏️ **Edit and confirm** events submitted by others (Wiki-style validation)
- 🔔 Receive **alerts** and updates for schools or years you follow

🎯 **Main Flow:**
- On login, user adds children to their profile, selecting school and year level
- App shows a personalized view: "What's on for your kids this week"
- Easily browse holidays, excursions, and school-specific events by year

SchoolScope solves the frustrating information gap most schools leave: chaotic communication, last-minute announcements, and no centralized, reliable event calendar.

By enabling parent-driven updates and confirmations, the app becomes a living source of truth, powered by the school community.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/schoolscope?schema=public"

# Auth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Quick automated setup (recommended)
npm run setup

# OR manual setup:
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed with 10,868 real Australian schools
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app!

---

## 🗃️ Database Schema

The Prisma schema includes:

- **Schools**: 10,868 real Australian schools with ACARA IDs, coordinates, and comprehensive data
- **Users**: Authentication and profile management
- **Children**: User's children linked to schools and year levels
- **Events**: School events with year level filtering and confirmation status
- **Sessions**: Lucia auth session management

---

## 📂 Project Structure

```
schoolscope/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts               # Sample data seeding
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   └── ui/              # ShadCN UI components
│   ├── lib/                 # Utilities and helpers
│   │   ├── db.ts            # Prisma client
│   │   └── utils.ts         # Utility functions
│   └── auth/                # Authentication
│       └── lucia.ts         # Lucia auth setup
├── package.json
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── next.config.js          # Next.js configuration
```

---

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

---

## ✅ MVP Goals

- [x] Project setup with Next.js 14, Tailwind, ShadCN
- [x] Database schema with Prisma
- [x] Basic UI components and landing page
- [ ] User authentication with Lucia
- [ ] User registration and login
- [ ] Add children to user profile
- [ ] School browsing and search
- [ ] Event calendar and filtering
- [ ] Event creation and editing
- [ ] Wiki-style event confirmation

---

## 🎨 UI Components

Built with ShadCN UI components:
- Button, Card, Input, Select
- Calendar, Dialog, Dropdown Menu
- Form components with validation
- Toast notifications

---

## 🔐 Authentication

Using Lucia Auth for:
- Session-based authentication
- Secure password handling
- User session management
- Integration with Prisma

---

## 📱 Features to Implement

### Phase 1 (MVP)
- User registration/login
- Profile management with children
- School search and selection
- Basic event calendar

### Phase 2
- Event creation and editing
- Year level filtering
- Event confirmation system
- School profile editing

### Phase 3
- Advanced filtering and search
- Notifications and alerts
- Mobile responsiveness
- Performance optimizations

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.