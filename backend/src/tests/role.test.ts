import request from 'supertest';
import { Express } from 'express';
import app from '../app';
import { Role, Permission } from '../types';
import { setupTestApp } from './setup';

describe('Role Controller', () => {
  let testApp: Express;
  const mockUserProfile = {
    id: 1,
    employee_id: 'EMP001',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    role: 'Admin', // Admin role required for role management
    permissions: []
  };

  const mockRole: Role = {
    id: 1,
    name: 'Test Role',
    description: 'Test role description',
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockPermissions: Permission[] = [
    {
      id: 1,
      name: 'read',
      description: 'Read permission',
      resource: 'users',
      action: 'read',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      name: 'write',
      description: 'Write permission',
      resource: 'users',
      action: 'write',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  beforeEach(() => {
    testApp = setupTestApp(app, mockUserProfile);
    jest.clearAllMocks();
  });

  describe('GET /api/roles', () => {
    it('should return all roles when authenticated as admin', async () => {
      const response = await request(testApp)
        .get('/api/roles')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(testApp)
        .get('/api/roles');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Not authenticated');
    });
  });

  describe('GET /api/roles/:id', () => {
    it('should return a role by ID when authenticated as admin', async () => {
      const response = await request(testApp)
        .get('/api/roles/1')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        description: expect.any(String)
      });
    });

    it('should return 404 when role not found', async () => {
      const response = await request(testApp)
        .get('/api/roles/999')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Role not found');
    });

    it('should return 400 for invalid role ID', async () => {
      const response = await request(testApp)
        .get('/api/roles/invalid')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid role ID');
    });
  });

  describe('POST /api/roles', () => {
    const newRoleData = {
      name: 'New Role',
      description: 'New role description'
    };

    it('should create a new role when authenticated as admin', async () => {
      const response = await request(testApp)
        .post('/api/roles')
        .set('Cookie', ['sessionId=test-session-id'])
        .send(newRoleData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(newRoleData);
    });

    it('should return 409 when role name already exists', async () => {
      const response = await request(testApp)
        .post('/api/roles')
        .set('Cookie', ['sessionId=test-session-id'])
        .send({ name: 'Test Role', description: 'Duplicate role' });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Role with this name already exists');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(testApp)
        .post('/api/roles')
        .set('Cookie', ['sessionId=test-session-id'])
        .send({ description: 'Missing name' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Role name is required');
    });
  });

  describe('PUT /api/roles/:id', () => {
    const updateRoleData = {
      name: 'Updated Role',
      description: 'Updated role description'
    };

    it('should update a role when authenticated as admin', async () => {
      const response = await request(testApp)
        .put('/api/roles/1')
        .set('Cookie', ['sessionId=test-session-id'])
        .send(updateRoleData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updateRoleData);
    });

    it('should return 404 when role not found', async () => {
      const response = await request(testApp)
        .put('/api/roles/999')
        .set('Cookie', ['sessionId=test-session-id'])
        .send(updateRoleData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Role not found');
    });
  });

  describe('DELETE /api/roles/:id', () => {
    it('should delete a role when authenticated as admin', async () => {
      const response = await request(testApp)
        .delete('/api/roles/1')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(204);
    });

    it('should return 404 when role not found', async () => {
      const response = await request(testApp)
        .delete('/api/roles/999')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Role not found');
    });

    it('should return 400 when role is in use', async () => {
      const response = await request(testApp)
        .delete('/api/roles/1')
        .set('Cookie', ['sessionId=test-session-id']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cannot delete role while it is assigned as primary role to users');
    });
  });

  describe('Role Permissions', () => {
    describe('GET /api/roles/:id/permissions', () => {
      it('should get role permissions when authenticated as admin', async () => {
        const response = await request(testApp)
          .get('/api/roles/1/permissions')
          .set('Cookie', ['sessionId=test-session-id']);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should return 404 when role not found', async () => {
        const response = await request(testApp)
          .get('/api/roles/999/permissions')
          .set('Cookie', ['sessionId=test-session-id']);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Role not found');
      });
    });

    describe('PUT /api/roles/:id/permissions', () => {
      it('should update role permissions when authenticated as admin', async () => {
        const response = await request(testApp)
          .put('/api/roles/1/permissions')
          .set('Cookie', ['sessionId=test-session-id'])
          .send({ permissions: [1, 2] });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Role permissions updated successfully');
      });

      it('should return 404 when role not found', async () => {
        const response = await request(testApp)
          .put('/api/roles/999/permissions')
          .set('Cookie', ['sessionId=test-session-id'])
          .send({ permissions: [1, 2] });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Role not found');
      });
    });
  });
}); 