# 🗃️ Database Setup with Real Australian School Data

Your SchoolScope project is now configured to use the **real Australian school data** from your `SchoolData.xlsx` file containing **10,868 schools**!

## 📊 What's in the Data

The Excel file contains comprehensive information about Australian schools:
- **10,868 schools** across all states and territories
- **ACARA IDs** (official Australian school identifiers)
- **Complete addresses** (suburb, state, postcode)
- **School types** (Primary, Secondary, Combined)
- **Sectors** (Government, Non-Government)
- **Geographic coordinates** (latitude/longitude)
- **Geolocation categories** (Major Cities, Regional, etc.)

## 🚀 Quick Setup

### Step 1: Create Environment File

Create a `.env.local` file in your project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/schoolscope?schema=public"

# Auth
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Replace:**
- `username` with your PostgreSQL username
- `password` with your PostgreSQL password
- Make sure the database `schoolscope` exists

### Step 2: Run Automated Setup

```bash
npm run setup
```

This will:
1. ✅ Check your database connection
2. 🔄 Run database migrations
3. 🌱 Seed all 10,868 schools from Excel
4. 📊 Show statistics by state

## 🛠️ Manual Setup (Alternative)

If you prefer to run each step manually:

```bash
# 1. Generate Prisma client
npm run db:generate

# 2. Create database tables
npm run db:migrate

# 3. Seed with real school data
npm run db:seed
```

## 📈 Expected Results

After seeding, you'll have approximately:
- **NSW**: ~3,000+ schools
- **VIC**: ~2,000+ schools  
- **QLD**: ~1,500+ schools
- **WA**: ~800+ schools
- **SA**: ~700+ schools
- **TAS**: ~200+ schools
- **ACT**: ~150+ schools
- **NT**: ~150+ schools

## 🔍 Verify Your Data

```bash
# Open Prisma Studio to browse the data
npm run db:studio
```

Visit `http://localhost:5555` to see all your schools!

## 🗂️ Updated Database Schema

The schema now includes all fields from your Excel data:

```prisma
model School {
  id                String   @id @default(cuid())
  acara_id          String   @unique      // Official ACARA ID
  name              String                // School name
  suburb            String                // Suburb
  state             String                // State (NSW, VIC, etc.)
  postcode          String                // Postcode
  type              String                // Primary/Secondary/Combined
  sector            String                // Gov/Non-Gov
  status            String                // Open/Closed
  geolocation       String?               // Major Cities/Regional
  parent_school_id  String?               // Parent school reference
  age_id            String?               // AGE identifier
  latitude          Float                 // GPS coordinates
  longitude         Float                 // GPS coordinates
  state_province_id String?               // State province ID
  // ... relationships
}
```

## 🎯 What You Can Build Now

With 10,868 real Australian schools, you can:

1. **School Search & Browse**
   - Search by name, suburb, or postcode
   - Filter by state, type, or sector
   - Show schools on a map using coordinates

2. **Location-Based Features**
   - Find schools near user's location
   - Show distance to schools
   - Regional vs metropolitan filtering

3. **Comprehensive School Profiles**
   - Official ACARA data
   - Government vs independent schools
   - Primary, secondary, or combined schools

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull
```

### Seeding Errors
```bash
# Reset and try again
npx prisma migrate reset
npm run db:seed
```

### Excel File Issues
Make sure `SchoolData.xlsx` is in the project root and contains the "ASL Search Results" sheet.

## 📱 Next Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Build School Search Page**
   - Create `/schools` page
   - Add search and filtering
   - Display school cards with real data

3. **Add Map Integration**
   - Use latitude/longitude for mapping
   - Show schools geographically

4. **Implement User Features**
   - Let users select their children's schools
   - Show personalized school information

---

🎉 **You now have a complete database of Australian schools ready for your SchoolScope app!** 