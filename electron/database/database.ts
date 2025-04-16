import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

// Singleton instance of PrismaClient
let prisma: PrismaClient;

// Function to initialize the database
export async function setupDatabase() {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  
  // Ensure database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Initialize Prisma client
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${path.join(dbDir, 'database.db')}`,
      },
    },
  });

  // Test database connection
  try {
    await prisma.$connect();
    console.log('Database connection established');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }

  return prisma;
}

// Function to get the Prisma client instance
export function getPrismaClient() {
  if (!prisma) {
    throw new Error('Database not initialized. Call setupDatabase first.');
  }
  return prisma;
} 