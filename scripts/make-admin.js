const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function makeAdmin(email) {
  try {
    const result = await db.user.updateMany({
      where: { email },
      data: { isAdmin: true },
    });

    if (result.count > 0) {
      console.log(`✅ Successfully made ${email} an admin`);
    } else {
      console.log(`❌ User with email ${email} not found`);
    }
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    await db.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/make-admin.js <email>');
  console.log('Example: node scripts/make-admin.js admin@schoolscope.com.au');
  process.exit(1);
}

makeAdmin(email); 