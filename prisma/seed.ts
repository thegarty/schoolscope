import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as XLSX from 'xlsx'
import path from 'node:path'

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })
async function main() {
  if (process.argv.includes('--if-empty') && (await db.school.count() || await db.user.count())) {
    console.log('Database already contains data; skipping seed')
    return
  }
  const workbook = XLSX.readFile(path.join(process.cwd(), 'data/SchoolData.xlsx'))
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]])
  const schools = rows.map(row => ({
    acara_id: String(row['ACARA ID']), name: String(row['School Name']), suburb: String(row['Suburb']),
    state: String(row['State']), postcode: String(row['Postcode']), type: String(row['Type']),
    sector: String(row['Sector']), status: String(row['Status']),
    geolocation: row['Geolocation'] ? String(row['Geolocation']) : null,
    parent_school_id: row['Parent School ID'] ? String(row['Parent School ID']) : null,
    age_id: row['AGE ID'] ? String(row['AGE ID']) : null,
    latitude: Number(row['Latitude']), longitude: Number(row['Longitude']),
    state_province_id: row['StateProvinceID'] ? String(row['StateProvinceID']) : null,
  }))
  for (let i = 0; i < schools.length; i += 500) {
    await db.school.createMany({ data: schools.slice(i, i + 500), skipDuplicates: true })
  }
  console.log(`Database contains ${await db.school.count()} schools. Users sign up through AllAuth.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => db.$disconnect())
