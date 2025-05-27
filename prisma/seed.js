const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('Reading school data from Excel file...')
  
  // Read the Excel file
  const workbook = XLSX.readFile(path.join(__dirname, '../data/SchoolData.xlsx'))
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet)

  console.log(`Found ${data.length} schools in Excel file`)

  // Transform the data to match our schema
  const schools = data.map((row) => ({
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
  
  // Create test users with children and events
  console.log('\nCreating test users...')
  
  // Get some sample schools for the test users' children
  const sampleSchools = await prisma.school.findMany({
    where: {
      state: 'NSW'
    },
    take: 5
  })

  if (sampleSchools.length > 0) {
    // Create 4 test users
    const testUsers = await Promise.all([
      prisma.user.upsert({
        where: { email: 'parent1@schoolscope.com' },
        update: {},
        create: {
          email: 'parent1@schoolscope.com',
          name: 'Sarah Johnson',
          password: '$2b$10$hq1DiJe165fgQ53AE/1/2ex8B5WF2STbA2IKgeB/jTrxk40HtLIH6' // password: "password123"
        }
      }),
      prisma.user.upsert({
        where: { email: 'parent2@schoolscope.com' },
        update: {},
        create: {
          email: 'parent2@schoolscope.com',
          name: 'Michael Chen',
          password: '$2b$10$hq1DiJe165fgQ53AE/1/2ex8B5WF2STbA2IKgeB/jTrxk40HtLIH6' // password: "password123"
        }
      }),
      prisma.user.upsert({
        where: { email: 'parent3@schoolscope.com' },
        update: {},
        create: {
          email: 'parent3@schoolscope.com',
          name: 'Emma Williams',
          password: '$2b$10$hq1DiJe165fgQ53AE/1/2ex8B5WF2STbA2IKgeB/jTrxk40HtLIH6' // password: "password123"
        }
      }),
      prisma.user.upsert({
        where: { email: 'parent4@schoolscope.com' },
        update: {},
        create: {
          email: 'parent4@schoolscope.com',
          name: 'David Martinez',
          password: '$2b$10$hq1DiJe165fgQ53AE/1/2ex8B5WF2STbA2IKgeB/jTrxk40HtLIH6' // password: "password123"
        }
      })
    ])

    // Create test children for each parent
    const testChildren = await Promise.all([
      // Parent 1 children
      prisma.child.upsert({
        where: { id: 'test-child-1' },
        update: {},
        create: {
          id: 'test-child-1',
          name: 'Emma Johnson',
          yearLevel: 'Year 5',
          userId: testUsers[0].id,
          schoolId: sampleSchools[0].id
        }
      }),
      prisma.child.upsert({
        where: { id: 'test-child-2' },
        update: {},
        create: {
          id: 'test-child-2',
          name: 'Jack Johnson',
          yearLevel: 'Year 8',
          userId: testUsers[0].id,
          schoolId: sampleSchools[1].id
        }
      }),
      // Parent 2 children
      prisma.child.upsert({
        where: { id: 'test-child-3' },
        update: {},
        create: {
          id: 'test-child-3',
          name: 'Lily Chen',
          yearLevel: 'Year 6',
          userId: testUsers[1].id,
          schoolId: sampleSchools[0].id
        }
      }),
      // Parent 3 children
      prisma.child.upsert({
        where: { id: 'test-child-4' },
        update: {},
        create: {
          id: 'test-child-4',
          name: 'Oliver Williams',
          yearLevel: 'Year 4',
          userId: testUsers[2].id,
          schoolId: sampleSchools[0].id
        }
      }),
      prisma.child.upsert({
        where: { id: 'test-child-5' },
        update: {},
        create: {
          id: 'test-child-5',
          name: 'Sophie Williams',
          yearLevel: 'Year 7',
          userId: testUsers[2].id,
          schoolId: sampleSchools[2].id
        }
      }),
      // Parent 4 children
      prisma.child.upsert({
        where: { id: 'test-child-6' },
        update: {},
        create: {
          id: 'test-child-6',
          name: 'Carlos Martinez',
          yearLevel: 'Year 9',
          userId: testUsers[3].id,
          schoolId: sampleSchools[1].id
        }
      })
    ])

    // Create some test events (mix of confirmed and unconfirmed)
    const testEvents = await Promise.all([
      prisma.event.upsert({
        where: { id: 'test-event-1' },
        update: {},
        create: {
          id: 'test-event-1',
          title: 'School Sports Day',
          description: 'Annual athletics carnival for all year levels. Students should wear sports uniform and bring water bottle.',
          startDate: new Date('2025-06-15T09:00:00Z'),
          endDate: new Date('2025-06-15T15:00:00Z'),
          yearLevels: ['Year 4', 'Year 5', 'Year 6'],
          category: 'Sports',
          confirmed: false, // Unconfirmed so we can test confirmations
          location: 'School Oval',
          schoolId: sampleSchools[0].id,
          userId: testUsers[0].id
        }
      }),
      prisma.event.upsert({
        where: { id: 'test-event-2' },
        update: {},
        create: {
          id: 'test-event-2',
          title: 'Parent Teacher Interviews',
          description: 'Individual 15-minute appointments with teachers. Please book through the school portal.',
          startDate: new Date('2025-06-20T15:30:00Z'),
          endDate: new Date('2025-06-20T19:00:00Z'),
          yearLevels: ['Year 7', 'Year 8', 'Year 9'],
          category: 'Academic',
          confirmed: false, // Unconfirmed so we can test confirmations
          location: 'School Library',
          schoolId: sampleSchools[1].id,
          userId: testUsers[1].id
        }
      }),
      prisma.event.upsert({
        where: { id: 'test-event-3' },
        update: {},
        create: {
          id: 'test-event-3',
          title: 'Science Fair',
          description: 'Students will present their science projects. Parents welcome to attend.',
          startDate: new Date('2025-07-10T10:00:00Z'),
          endDate: new Date('2025-07-10T14:00:00Z'),
          yearLevels: ['Year 5', 'Year 6'],
          category: 'Academic',
          confirmed: false, // Unconfirmed so we can test confirmations
          location: 'School Hall',
          schoolId: sampleSchools[0].id,
          userId: testUsers[2].id
        }
      }),
      prisma.event.upsert({
        where: { id: 'test-event-4' },
        update: {},
        create: {
          id: 'test-event-4',
          title: 'School Concert',
          description: 'Annual music and drama performance by students. Tickets required.',
          startDate: new Date('2025-08-05T18:00:00Z'),
          endDate: new Date('2025-08-05T20:30:00Z'),
          yearLevels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'],
          category: 'Arts',
          confirmed: false, // Unconfirmed so we can test confirmations
          location: 'School Auditorium',
          schoolId: sampleSchools[0].id,
          userId: testUsers[3].id
        }
      }),
      // Create a private event for testing
      prisma.event.upsert({
        where: { id: 'test-private-event-1' },
        update: {},
        create: {
          id: 'test-private-event-1',
          title: 'Emma\'s Doctor Appointment',
          description: 'Annual check-up with Dr. Smith',
          startDate: new Date('2025-06-25T14:00:00Z'),
          endDate: new Date('2025-06-25T15:00:00Z'),
          yearLevels: [],
          category: 'Health',
          confirmed: true, // Private events are auto-confirmed
          isPrivate: true,
          location: 'Medical Centre',
          schoolId: sampleSchools[0].id,
          userId: testUsers[0].id,
          childId: 'test-child-1'
        }
      })
    ])

    console.log('✅ Test users created successfully!')
    console.log('\n👥 Test Accounts:')
    console.log('📧 parent1@schoolscope.com (Sarah Johnson) - 🔑 password123')
    console.log('📧 parent2@schoolscope.com (Michael Chen) - 🔑 password123')
    console.log('📧 parent3@schoolscope.com (Emma Williams) - 🔑 password123')
    console.log('📧 parent4@schoolscope.com (David Martinez) - 🔑 password123')
    console.log(`\n👶 Total Children: ${testChildren.length}`)
    console.log(`📅 Total Events: ${testEvents.length} (4 public + 1 private)`)
    console.log('\n🎯 All public events are unconfirmed - perfect for testing confirmations!')
  }
  
  // Show some statistics
  const totalSchools = await prisma.school.count()
  const totalUsers = await prisma.user.count()
  const totalChildren = await prisma.child.count()
  const totalEvents = await prisma.event.count()
  
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

  console.log(`\n📊 Database Statistics:`)
  console.log(`🏫 Total schools: ${totalSchools}`)
  console.log(`👥 Total users: ${totalUsers}`)
  console.log(`👶 Total children: ${totalChildren}`)
  console.log(`📅 Total events: ${totalEvents}`)
  
  console.log('\n🏫 Schools by state:')
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