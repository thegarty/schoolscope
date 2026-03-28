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

      // Seeding is intentionally not automatic in production startup.
      // The project uses a custom Prisma client output, and startup should
      // only ensure schema migrations are applied before app boot.
      console.log('ℹ️ Automatic seed skipped on startup');

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