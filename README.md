# 🏫 SchoolScope

**Community-driven school calendar and profile management system for Australian schools**

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7.1-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🏫 **Comprehensive School Database**
- **10,868+ Australian schools** pre-loaded with official data
- Complete school profiles with location, type, and sector information
- Community-driven school information updates with democratic voting system

### 👥 **User & Family Management**
- Secure authentication with Lucia Auth
- Multi-child family support
- Easy child profile management (add, edit, delete)
- Year level tracking and school associations

### 📅 **Dual Event System**
- **Public Events**: Community-wide school events visible to all parents
- **Private Events**: Personal family reminders and appointments
- Event categories: Academic, Sports, Arts, Health, and more
- Location support with address details

### ✅ **Community Validation**
- **Event Confirmations**: Community members can verify public events
- Real-time confirmation counts and status updates
- Prevents misinformation through crowd-sourced validation
- Event owners cannot confirm their own events (prevents bias)

### 🗳️ **Democratic School Editing**
- Any community member can suggest school information updates
- Voting system with 3-vote threshold for approval/rejection
- Change history tracking and transparency
- Prevents vandalism through community oversight

### 📱 **Calendar Integration**
- Export events to Google Calendar, Outlook, Apple Calendar
- .ics file generation for universal calendar support
- Location data included in calendar exports
- Automatic timezone handling

### 🎨 **Modern User Experience**
- Responsive design for desktop and mobile
- Clean, intuitive interface with Tailwind CSS
- Real-time updates and interactions
- Accessible components with Radix UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker (for PostgreSQL)
- Git

### 1. Clone & Install
```bash
git clone https://github.com/thegarty/schoolscope.git
cd schoolscope
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp env-template.txt .env.local

# Edit .env.local with your settings
# DATABASE_URL is pre-configured for Docker PostgreSQL
```

### 3. Database Setup
```bash
# Start PostgreSQL with Docker
npm run docker:up

# Apply database schema
npm run db:migrate

# Seed with Australian schools + test data
npm run db:seed
```

### 4. Start Development
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application!

## 🧪 Test Accounts

The seed script creates 4 test parent accounts for testing confirmations:

| Email | Password | Parent Name | Children |
|-------|----------|-------------|----------|
| `parent1@schoolscope.com` | `password123` | Sarah Johnson | Emma (Year 5), Jack (Year 8) |
| `parent2@schoolscope.com` | `password123` | Michael Chen | Lily (Year 6) |
| `parent3@schoolscope.com` | `password123` | Emma Williams | Oliver (Year 4), Sophie (Year 7) |
| `parent4@schoolscope.com` | `password123` | David Martinez | Carlos (Year 9) |

## 📊 Database Schema

### Core Models
- **Schools**: 10,868+ Australian schools with comprehensive data
- **Users**: Parent accounts with secure authentication
- **Children**: Student profiles linked to users and schools
- **Events**: Public and private events with confirmation system
- **EventConfirmations**: Community validation tracking
- **SchoolEdits**: Democratic school information updates
- **SchoolEditVotes**: Voting system for school changes

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Robust relational database
- **Lucia Auth** - Secure session-based authentication

### Development
- **Docker** - Containerized PostgreSQL
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:migrate      # Apply database migrations
npm run db:seed         # Seed database with test data
npm run db:studio       # Open Prisma Studio (database GUI)
npm run db:reset        # Reset database (development only)
npm run db:generate     # Generate Prisma client

# Docker
npm run docker:up       # Start PostgreSQL container
npm run docker:down     # Stop PostgreSQL container
npm run docker:logs     # View PostgreSQL logs
```

## 🏗️ Project Structure

```
schoolscope/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API endpoints
│   │   ├── auth/           # Authentication pages
│   │   ├── children/       # Child management
│   │   ├── events/         # Event management
│   │   ├── schools/        # School pages
│   │   └── dashboard/      # Main dashboard
│   ├── components/         # Reusable React components
│   │   └── ui/            # UI component library
│   ├── lib/               # Utility functions
│   └── auth/              # Authentication logic
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.js           # Database seeding
│   └── migrations/       # Database migrations
├── data/
│   ├── SchoolData.xlsx    # Australian schools dataset
│   └── README.md         # Data documentation
└── public/               # Static assets
```

## 🔒 Security Features

- **Session-based authentication** with secure cookies
- **CSRF protection** built into Next.js
- **SQL injection prevention** with Prisma ORM
- **Input validation** and sanitization
- **User isolation** - users can only access their own data
- **Democratic oversight** prevents malicious school edits

## 🌟 Key Innovations

### Community-Driven Validation
Unlike traditional school apps, SchoolScope uses community validation to ensure event accuracy. Parents can confirm events they didn't create, building trust through crowd-sourcing.

### Democratic School Management
School information updates require community approval, preventing vandalism while allowing necessary corrections and updates.

### Dual Event System
Separates public school events from private family reminders, with appropriate privacy controls and auto-confirmation for personal events.

### Comprehensive Australian Coverage
Pre-loaded with official data for 10,868+ Australian schools, eliminating setup friction for parents.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Australian school data sourced from official education departments
- Built with modern web technologies and best practices
- Inspired by the need for better school community communication

---

**Made with ❤️ for Australian school communities**