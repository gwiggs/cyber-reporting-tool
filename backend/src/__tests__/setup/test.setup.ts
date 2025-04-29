import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

let mongoServer: MongoMemoryServer

export const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
}

export const cleanupTestDB = async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
}

export const clearCollections = async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

export const generateTestToken = (userId: string) => {
  return jwt.sign(
    { id: userId, email: 'test@test.com' },
    process.env.JWT_KEY!,
    { expiresIn: '1h' }
  )
} 