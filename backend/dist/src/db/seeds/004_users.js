"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const index_1 = require("../index");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function seed() {
    // Check if users already exist
    const checkResult = await (0, index_1.query)('SELECT COUNT(*) FROM users');
    if (parseInt(checkResult.rows[0].count) > 0) {
        console.log('Users already seeded, skipping...');
        return;
    }
    // Get role IDs
    const rolesResult = await (0, index_1.query)('SELECT id, name FROM roles');
    const roles = rolesResult.rows;
    // Map role names to IDs for easier reference
    const roleMap = {};
    roles.forEach(role => {
        roleMap[role.name] = role.id;
    });
    // Get department IDs
    const deptsResult = await (0, index_1.query)('SELECT id, name, organisation_id FROM departments');
    const depts = deptsResult.rows;
    // Generate password hash for default users
    const saltRounds = 10;
    const defaultPasswordHash = await bcrypt_1.default.hash('Password123!', saltRounds);
    // Create admin user
    const adminResult = await (0, index_1.query)(`INSERT INTO users 
      (employee_id, first_name, last_name, email, organisation_id, department_id, rank, primary_role_id) 
     VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`, [
        'ADMIN001',
        'System',
        'Administrator',
        'admin@example.com',
        depts[0].organisation_id, // First department's organisation
        depts[0].id, // IT Department
        'Administrator',
        roleMap['Admin'] // Admin role
    ]);
    const adminId = adminResult.rows[0].id;
    // Create admin credentials
    await (0, index_1.query)(`INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)`, [adminId, defaultPasswordHash]);
    // Create sample users with different roles
    const sampleUsers = [
        {
            employee_id: 'MGR001',
            first_name: 'John',
            last_name: 'Manager',
            email: 'manager@example.com',
            department_id: depts[2].id, // Administration
            organisation_id: depts[2].organisation_id,
            rank: 'Senior Manager',
            role: 'Manager'
        },
        {
            employee_id: 'USR001',
            first_name: 'Alice',
            last_name: 'User',
            email: 'alice@example.com',
            department_id: depts[3].id, // R&D
            organisation_id: depts[3].organisation_id,
            rank: 'Developer',
            role: 'User'
        },
        {
            employee_id: 'USR002',
            first_name: 'Bob',
            last_name: 'Smith',
            email: 'bob@example.com',
            department_id: depts[4].id, // Field Operations
            organisation_id: depts[4].organisation_id,
            rank: 'Field Agent',
            role: 'User'
        },
        {
            employee_id: 'GST001',
            first_name: 'Guest',
            last_name: 'User',
            email: 'guest@example.com',
            department_id: depts[0].id, // IT Department
            organisation_id: depts[0].organisation_id,
            rank: 'Visitor',
            role: 'Guest'
        }
    ];
    // Insert sample users
    for (const user of sampleUsers) {
        const userResult = await (0, index_1.query)(`INSERT INTO users 
        (employee_id, first_name, last_name, email, organisation_id, department_id, rank, primary_role_id) 
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`, [
            user.employee_id,
            user.first_name,
            user.last_name,
            user.email,
            user.organisation_id,
            user.department_id,
            user.rank,
            roleMap[user.role]
        ]);
        const userId = userResult.rows[0].id;
        // Create user credentials
        await (0, index_1.query)(`INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)`, [userId, defaultPasswordHash]);
    }
    console.log('Users seeded successfully');
}
;
//# sourceMappingURL=004_users.js.map