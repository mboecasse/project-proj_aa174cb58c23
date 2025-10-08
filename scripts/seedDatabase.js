// File: scripts/seedDatabase.js
// Generated: 2025-10-08 13:05:50 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_mef9ibrscfyt


const User = require('../src/models/User');


const bcrypt = require('bcryptjs');


const connectDB = require('../src/config/database');


const mongoose = require('mongoose');

/**
 * Database seeding script for development data
 * Creates sample users with various roles and states
 */


const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123!@#',
    role: 'admin',
    isVerified: true
  },
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'User123!@#',
    role: 'user',
    isVerified: true
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'User123!@#',
    role: 'user',
    isVerified: true
  },
  {
    name: 'Unverified User',
    email: 'unverified@example.com',
    password: 'User123!@#',
    role: 'user',
    isVerified: false
  },
  {
    name: 'Test User 1',
    email: 'test1@example.com',
    password: 'Test123!@#',
    role: 'user',
    isVerified: true
  },
  {
    name: 'Test User 2',
    email: 'test2@example.com',
    password: 'Test123!@#',
    role: 'user',
    isVerified: true
  },
  {
    name: 'Moderator User',
    email: 'moderator@example.com',
    password: 'Mod123!@#',
    role: 'moderator',
    isVerified: true
  },
  {
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'Demo123!@#',
    role: 'user',
    isVerified: true
  }
];

/**
 * Seed the database with sample users
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    const deleteResult = await User.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing users`);

    // Create users
    const createdUsers = [];
    for (const userData of seedUsers) {
      try {
        const user = await User.create(userData);
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.email}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully seeded ${createdUsers.length} users`);
    console.log('\n📋 Sample Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@example.com');
    console.log('  Password: Admin123!@#');
    console.log('\nRegular User:');
    console.log('  Email: john.doe@example.com');
    console.log('  Password: User123!@#');
    console.log('\nUnverified User:');
    console.log('  Email: unverified@example.com');
    console.log('  Password: User123!@#');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Disconnect from database
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('🎉 Seeding completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error(error.stack);

    // Ensure connection is closed on error
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

/**
 * Clear all data from database
 */
async function clearDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear all users
    const deleteResult = await User.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} users`);

    // Disconnect from database
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('🎉 Database cleared successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    console.error(error.stack);

    // Ensure connection is closed on error
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

// Handle command line arguments


const command = process.argv[2];

if (command === 'clear') {
  clearDatabase();
} else if (command === 'seed' || !command) {
  seedDatabase();
} else {
  console.log('Usage:');
  console.log('  npm run seed        - Seed database with sample data');
  console.log('  npm run seed:clear  - Clear all data from database');
  console.log('\nOr directly:');
  console.log('  node scripts/seedDatabase.js seed');
  console.log('  node scripts/seedDatabase.js clear');
  process.exit(1);
}
