const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runStartup() {
  // Only run on Railway (production environment)
  if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
    console.log('🚀 Railway deployment detected, running startup tasks...');
    
    try {
      // Run database migrations
      console.log('📦 Running database migrations...');
      await execAsync('npx prisma migrate deploy');
      console.log('✅ Migrations completed');
      
      // Check if seeding is needed
      const prisma = new PrismaClient();
      
      try {
        const schoolCount = await prisma.school.count();
        const userCount = await prisma.user.count();
        
        if (schoolCount === 0 && userCount === 0) {
          console.log('📦 Database is empty, running seed...');
          await execAsync('npm run db:seed');
          console.log('✅ Seeding completed');
        } else {
          console.log(`✅ Database already contains data (${schoolCount} schools, ${userCount} users)`);
          console.log('🚫 Skipping seed to prevent duplicates');
        }
      } catch (dbError) {
        console.log('⚠️ Database not ready yet, skipping seed check');
      } finally {
        await prisma.$disconnect();
      }
      
      console.log('🎉 Startup tasks completed successfully!');
      
    } catch (error) {
      console.error('❌ Startup error:', error);
      console.log('⚠️ Continuing with app startup...');
      // Don't exit - let the app start anyway
    }
  } else {
    console.log('🏠 Local development detected, skipping startup tasks');
  }
}

module.exports = { runStartup }; 