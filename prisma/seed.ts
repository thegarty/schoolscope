import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Reading school data from Excel file...')
  
  // Read the Excel file
  const workbook = XLSX.readFile(path.join(__dirname, '../SchoolData.xlsx'))
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet)

  console.log(`Found ${data.length} schools in Excel file`)

  // Transform the data to match our schema
  const schools = data.map((row: any) => ({
    acara_id: String(row['ACARA ID']),
    name: row['School Name'],
    suburb: row['Suburb'],
    state: row['State'],
    postcode: String(row['Postcode']),
    type: row['Type'],
    sector: row['Sector'],
    status: row['Status'],
    geolocation: row['Geolocation'] || null,
    parent_school_id: row['Parent School ID'] ? String(row['Parent School ID']) : null,
    age_id: row['AGE ID'] ? String(row['AGE ID']) : null,
    latitude: Number(row['Latitude']),
    longitude: Number(row['Longitude']),
    state_province_id: row['StateProvinceID'] ? String(row['StateProvinceID']) : null
  }))

  console.log('Starting database seeding...')
  
  // Insert schools in batches to avoid overwhelming the database
  const batchSize = 100
  let processed = 0

  for (let i = 0; i < schools.length; i += batchSize) {
    const batch = schools.slice(i, i + batchSize)
    
    try {
      await prisma.school.createMany({
        data: batch,
        skipDuplicates: true
      })
      
      processed += batch.length
      console.log(`Processed ${processed}/${schools.length} schools`)
    } catch (error) {
      console.error(`Error processing batch ${i}-${i + batchSize}:`, error)
      // Continue with next batch
    }
  }

  console.log('Seeding completed!')
  
  // Show some statistics
  const totalSchools = await prisma.school.count()
  const schoolsByState = await prisma.school.groupBy({
    by: ['state'],
    _count: {
      state: true
    },
    orderBy: {
      _count: {
        state: 'desc'
      }
    }
  })

  console.log(`\nTotal schools in database: ${totalSchools}`)
  console.log('\nSchools by state:')
  schoolsByState.forEach(state => {
    console.log(`${state.state}: ${state._count.state}`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 