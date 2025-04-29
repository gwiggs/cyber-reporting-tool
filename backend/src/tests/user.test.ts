import request from 'supertest';
import { Express } from 'express';
import app from '../app';
import userModel from '../models/userModel';
import { UserProfile } from '../types';
import { setupTestApp } from './setup';

// Mock dependencies
jest.mock('../models/userModel');
const mockUserModel = userModel as jest.Mocked<typeof userModel>;

describe('User Controller', () => {
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
  });

  describe('GET /api/users', () => {
    it('should return all users when authenticated', async () => {
      const response = await request(testApp)
        .get('/api/users')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockUserProfile]);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(testApp)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Not authenticated');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user by ID when authenticated', async () => {
      const response = await request(testApp)
        .get('/api/users/1')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserProfile);
    });

    it('should return 404 when user not found', async () => {
      const response = await request(testApp)
        .get('/api/users/999')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    const newUserData = {
      employee_id: 'EMP002',
      first_name: 'New',
      last_name: 'User',
      email: 'new@example.com',
      primary_role_id: 1,
      password: 'Password123!'
    };

    it('should create a new user when authenticated', async () => {
      const response = await request(testApp)
        .post('/api/users')
        .set('Cookie', ['sessionId=test-session-id'])
        .send(newUserData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(expect.objectContaining(newUserData));
    });
  });
}); 