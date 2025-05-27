# Data Directory

This directory contains data files used by the SchoolScope application.

## Files

### `SchoolData.xlsx`
- **Source**: Official Australian school data from education departments
- **Content**: 10,868+ Australian schools with comprehensive information
- **Columns**: ACARA ID, School Name, Suburb, State, Postcode, Type, Sector, Status, Geolocation, Latitude, Longitude, and more
- **Usage**: Used by `prisma/seed.js` to populate the schools database table
- **Size**: ~1.2MB

## Data Schema

The Excel file contains the following key columns:
- `ACARA ID` - Unique identifier for each school
- `School Name` - Official school name
- `Suburb` - School suburb/locality
- `State` - Australian state (NSW, VIC, QLD, WA, SA, TAS, NT, ACT)
- `Postcode` - Postal code
- `Type` - School type (Primary, Secondary, Combined, etc.)
- `Sector` - Government, Catholic, Independent
- `Status` - Operating status
- `Latitude/Longitude` - Geographic coordinates
- `Geolocation` - Combined location string

## Usage

The data is automatically imported when running:
```bash
npm run db:seed
```

This populates the `schools` table in the PostgreSQL database with all Australian school information, providing a comprehensive foundation for the SchoolScope application.

## Data Integrity

- All schools have unique ACARA IDs
- Geographic coordinates are included for mapping features
- Data is sourced from official education department records
- Regular updates can be applied by replacing this file and re-running the seed script 