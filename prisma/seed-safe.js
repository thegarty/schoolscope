const { PrismaClient } = require('@prisma/client');

async function safeSeed() {
  const prisma = new PrismaClient();
  
  try {
    // Check if database is already seeded
    const schoolCount = await prisma.school.count();
    const userCount = await prisma.user.count();
    
    if (schoolCount > 0 || userCount > 0) {
      console.log(`✅ Database already contains data (${schoolCount} schools, ${userCount} users)`);
      console.log('🚫 Skipping seed to prevent duplicates');
      return;
    }
    
    console.log('📦 Database is empty, running full seed...');
    
    // Import and run the main seed script
    require('./seed.js');
    
  } catch (error) {
    console.error('❌ Error during safe seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

safeSeed(); 