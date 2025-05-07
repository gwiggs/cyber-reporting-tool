"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const index_1 = require("../index");
async function seed() {
    // Check if roles already exist
    const checkResult = await (0, index_1.query)('SELECT COUNT(*) FROM roles');
    if (parseInt(checkResult.rows[0].count) > 0) {
        console.log('Roles already seeded, skipping...');
        return;
    }
    // Seed roles
    const rolesData = [
        { name: 'Admin', description: 'System administrator with full access' },
        { name: 'Manager', description: 'Department manager with elevated privileges' },
        { name: 'User', description: 'Standard user with basic access' },
        { name: 'Guest', description: 'Limited read-only access' }
    ];
    const roleIds = {};
    // Use a transaction to ensure all operations complete or none do
    await (0, index_1.transaction)(async (client) => {
        // Insert roles and store their IDs
        for (const role of rolesData) {
            const result = await client.query('INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id', [role.name, role.description]);
            roleIds[role.name] = result.rows[0].id;
        }
        // Seed permissions
        const permissionsData = [
            { name: 'user:read', description: 'View user information', resource: 'users', action: 'read' },
            { name: 'user:create', description: 'Create new users', resource: 'users', action: 'create' },
            { name: 'user:update', description: 'Update user information', resource: 'users', action: 'update' },
            { name: 'user:delete', description: 'Delete users', resource: 'users', action: 'delete' },
            { name: 'task:read', description: 'View tasks', resource: 'tasks', action: 'read' },
            { name: 'task:create', description: 'Create new tasks', resource: 'tasks', action: 'create' },
            { name: 'task:update', description: 'Update tasks', resource: 'tasks', action: 'update' },
            { name: 'task:delete', description: 'Delete tasks', resource: 'tasks', action: 'delete' },
            { name: 'report:read', description: 'View reports', resource: 'reports', action: 'read' },
            { name: 'report:create', description: 'Create reports', resource: 'reports', action: 'create' }
        ];
        const permissionIds = {};
        // Insert permissions and store their IDs
        for (const permission of permissionsData) {
            const result = await client.query('INSERT INTO permissions (name, description, resource, action) VALUES ($1, $2, $3, $4) RETURNING id', [permission.name, permission.description, permission.resource, permission.action]);
            permissionIds[permission.name] = result.rows[0].id;
        }
        // Assign permissions to roles
        const rolePermissions = [
            // Admin gets all permissions
            ...Object.keys(permissionIds).map(permName => ({
                role_id: roleIds['Admin'],
                permission_id: permissionIds[permName]
            })),
            // Manager permissions
            { role_id: roleIds['Manager'], permission_id: permissionIds['user:read'] },
            { role_id: roleIds['Manager'], permission_id: permissionIds['task:read'] },
            { role_id: roleIds['Manager'], permission_id: permissionIds['task:create'] },
            { role_id: roleIds['Manager'], permission_id: permissionIds['task:update'] },
            { role_id: roleIds['Manager'], permission_id: permissionIds['report:read'] },
            { role_id: roleIds['Manager'], permission_id: permissionIds['report:create'] },
            // User permissions
            { role_id: roleIds['User'], permission_id: permissionIds['user:read'] },
            { role_id: roleIds['User'], permission_id: permissionIds['task:read'] },
            { role_id: roleIds['User'], permission_id: permissionIds['task:update'] },
            // Guest permissions
            { role_id: roleIds['Guest'], permission_id: permissionIds['task:read'] }
        ];
        // Insert role permissions
        for (const rp of rolePermissions) {
            await client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)', [rp.role_id, rp.permission_id]);
        }
    });
    console.log('Roles and permissions seeded successfully');
}
;
//# sourceMappingURL=003_roles.js.map