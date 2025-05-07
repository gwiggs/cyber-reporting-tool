"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../db/postgres"));
/**
 * Service for managing and checking user permissions
 */
const permissionService = {
    /**
     * Check if a user has a specific permission
     * @param userId User ID to check
     * @param resource Resource to check (e.g., 'users', 'tasks')
     * @param action Action to check (e.g., 'read', 'create', 'update', 'delete')
     * @returns Boolean indicating if user has permission
     */
    async hasPermission(userId, resource, action) {
        const result = await postgres_1.default.query(`SELECT COUNT(*) FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN roles r ON rp.role_id = r.id
       INNER JOIN users u ON u.primary_role_id = r.id
       WHERE u.id = $1 AND p.resource = $2 AND p.action = $3
       
       UNION
       
       SELECT COUNT(*) FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1 AND p.resource = $2 AND p.action = $3`, [userId, resource, action]);
        return parseInt(result.rows[0].count) > 0;
    },
    /**
     * Get all permissions for a user
     * @param userId User ID to get permissions for
     * @returns Array of Permission objects
     */
    async getUserPermissions(userId) {
        const result = await postgres_1.default.query(`SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description, p.created_at, p.updated_at 
       FROM permissions p 
       INNER JOIN role_permissions rp ON p.id = rp.permission_id 
       INNER JOIN roles r ON rp.role_id = r.id
       INNER JOIN users u ON u.primary_role_id = r.id
       WHERE u.id = $1
       
       UNION
       
       SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description, p.created_at, p.updated_at 
       FROM permissions p 
       INNER JOIN role_permissions rp ON p.id = rp.permission_id 
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id 
       WHERE ur.user_id = $1`, [userId]);
        return result.rows;
    },
    /**
     * Get permissions for a specific role
     * @param roleId Role ID to get permissions for
     * @returns Array of Permission objects
     */
    async getRolePermissions(roleId) {
        const result = await postgres_1.default.query(`SELECT p.id, p.name, p.resource, p.action, p.description, p.created_at, p.updated_at 
       FROM permissions p 
       INNER JOIN role_permissions rp ON p.id = rp.permission_id 
       WHERE rp.role_id = $1`, [roleId]);
        return result.rows;
    },
    /**
     * Add a permission to a role
     * @param roleId Role ID to add permission to
     * @param permissionId Permission ID to add
     */
    async addPermissionToRole(roleId, permissionId) {
        await postgres_1.default.query(`INSERT INTO role_permissions (role_id, permission_id) 
       VALUES ($1, $2) 
       ON CONFLICT (role_id, permission_id) DO NOTHING`, [roleId, permissionId]);
    },
    /**
     * Remove a permission from a role
     * @param roleId Role ID to remove permission from
     * @param permissionId Permission ID to remove
     */
    async removePermissionFromRole(roleId, permissionId) {
        await postgres_1.default.query(`DELETE FROM role_permissions 
       WHERE role_id = $1 AND permission_id = $2`, [roleId, permissionId]);
    }
};
exports.default = permissionService;
//# sourceMappingURL=permissionService.js.map