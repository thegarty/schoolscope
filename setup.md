# 🚀 SchoolScope Setup Instructions

Follow these steps to get SchoolScope running on your local machine.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **PostgreSQL** database running locally ([Download here](https://www.postgresql.org/download/))
- **Git** installed ([Download here](https://git-scm.com/))

## Step 1: Clone and Install

```bash
# Clone the repository (if from git)
git clone <repository-url>
cd school-helper

# Install dependencies
npm install
```

## Step 2: Database Setup

1. **Create a PostgreSQL database:**
   ```sql
   CREATE DATABASE schoolscope;
   ```

2. **Create your environment file:**
   ```bash
   # Copy the example file
   cp .env.example .env.local
   ```

3. **Edit `.env.local` with your database credentials:**
   ```env
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/schoolscope?schema=public"
   NEXTAUTH_SECRET="your-random-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

## Step 3: Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Create and run migrations
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

## Step 4: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see SchoolScope!

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Check your database credentials in `.env.local`
- Ensure the database `schoolscope` exists

### Port Already in Use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Missing Dependencies
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Prisma Issues
```bash
# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Or just regenerate client
npm run db:generate
```

## Next Steps

1. **Explore the app** - Browse the landing page and UI components
2. **Check the database** - Run `npm run db:studio` to view data
3. **Start developing** - Add authentication, create pages, build features

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run lint` - Run linting
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed sample data
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
school-helper/
├── prisma/           # Database schema and migrations
├── src/
│   ├── app/         # Next.js pages (App Router)
│   ├── components/  # React components
│   ├── lib/         # Utilities and database
│   └── auth/        # Authentication setup
├── package.json     # Dependencies and scripts
└── README.md        # Project documentation
```

Happy coding! 🎉 