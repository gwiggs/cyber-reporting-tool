// src/db/migrationRunner.ts
import testConnection from './testConnection';
import { pool } from './index';
import { up as createTables, down as dropTables } from './migrations/001_create_tables';
import { seed as seedOrganisations } from './seeds/001_organisations';
import { seed as seedDepartments } from './seeds/002_departments';
import { seed as seedRoles } from './seeds/003_roles';
import { seed as seedUsers } from './seeds/004_users';

// Function to run all migrations and seeds
export async function runMigrations(): Promise<void> {
  try {
    console.log('Testing database connection...');
    const connectionSuccessful = await testConnection();
    
    if (!connectionSuccessful) {
      throw new Error('Database connection failed, aborting migrations');
    }
    
    console.log('Starting database migrations and seeding...');
    
    // Run migrations
    console.log('Running migrations...');
    await createTables();
    
    // Run seeds
    console.log('Running seeds...');
    await seedOrganisations();
    await seedDepartments();
    await seedRoles();
    await seedUsers();
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

// Export a function to rollback migrations if needed
export async function rollbackMigrations(): Promise<void> {
  try {
    console.log('Rolling back migrations...');
    await dropTables();
    console.log('Rollback completed successfully!');
  } catch (error) {
    console.error('Error rolling back migrations:', error);
    throw error;
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Execute appropriate command
  if (command === 'rollback') {
    rollbackMigrations()
      .then(() => {
        pool.end();
        process.exit(0);
      })
      .catch(() => {
        pool.end();
        process.exit(1);
      });
  } else {
    runMigrations()
      .then(() => {
        pool.end();
        process.exit(0);
      })
      .catch(() => {
        pool.end();
        process.exit(1);
      });
  }
}