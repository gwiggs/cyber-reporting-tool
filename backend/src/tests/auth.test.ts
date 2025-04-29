import request from 'supertest';
import { Express } from 'express';
import app from '../app';
import authService from '../services/authService';
import { UserProfile } from '../types';
import { setupTestApp } from './setup';
import redisClient from '../config/redis';

// Mock authService and Redis client
jest.mock('../services/authService');
jest.mock('../config/redis');
const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

describe('Auth Controller', () => {
  let testApp: Express;
  const mockUserProfile: UserProfile = {
    id: 1,
    employee_id: 'EMP001',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    role: 'User',
    permissions: []
  };

  beforeEach(() => {
    testApp = setupTestApp(app, mockUserProfile);
    jest.clearAllMocks();
    // Mock Redis methods
    mockRedisClient.set.mockResolvedValue('OK');
    mockRedisClient.get.mockResolvedValue(JSON.stringify(mockUserProfile));
    mockRedisClient.del.mockResolvedValue(1);
  });

  afterEach(async () => {
    await mockRedisClient.quit();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials and create Redis session', async () => {
      // Mock successful authentication
      mockAuthService.authenticate.mockResolvedValue({
        success: true,
        user: mockUserProfile,
        message: 'Login successful'
      });
      mockAuthService.createSession.mockResolvedValue('test-session-id');

      const response = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(mockUserProfile);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(mockAuthService.authenticate).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockAuthService.createSession).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.stringContaining('session:'),
        expect.any(String),
        'EX',
        24 * 60 * 60 // 24 hours
      );
    });

    it('should return 401 with invalid credentials and not create Redis session', async () => {
      // Mock failed authentication
      mockAuthService.authenticate.mockResolvedValue({
        success: false,
        message: 'Invalid credentials'
      });

      const response = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
      expect(mockAuthService.createSession).not.toHaveBeenCalled();
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully and remove Redis session', async () => {
      mockAuthService.destroySession.mockResolvedValue(true);

      const response = await request(testApp)
        .post('/api/auth/logout')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
      expect(mockAuthService.destroySession).toHaveBeenCalledWith('test-session-id');
      expect(mockRedisClient.del).toHaveBeenCalledWith('session:test-session-id');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(testApp)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated with valid Redis session', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockUserProfile));

      const response = await request(testApp)
        .get('/api/auth/me')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserProfile);
      expect(mockRedisClient.get).toHaveBeenCalledWith('session:test-session-id');
    });

    it('should return 401 when session not found in Redis', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const response = await request(testApp)
        .get('/api/auth/me')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(testApp)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
    });
  });
}); 