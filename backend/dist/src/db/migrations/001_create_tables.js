"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const index_1 = require("../index");
async function up() {
    // Read from the uploaded schema file
    const schemaSQL = `
    -- organisations table
    CREATE TABLE IF NOT EXISTS organisations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Departments table
    CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        organisation_id INTEGER NOT NULL REFERENCES organisations(id),
        name VARCHAR(100) NOT NULL,
        department_code VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organisation_id, department_code)
    );

    -- Roles table (for RBAC)
    CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Permissions table
    CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        resource VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(resource, action)
    );

    -- Role permissions junction table
    CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id)
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        organisation_id INTEGER REFERENCES organisations(id),
        department_id INTEGER REFERENCES departments(id),
        rank VARCHAR(50),
        primary_role_id INTEGER REFERENCES roles(id),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- User credentials table (separated for security)
    CREATE TABLE IF NOT EXISTS user_credentials (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        password_hash VARCHAR(255) NOT NULL,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- User roles junction table (for additional roles beyond primary)
    CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, role_id)
    );

    -- Audit log table for database access/changes
    CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        table_name VARCHAR(100),
        record_id INTEGER,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Sessions table (if using database sessions instead of Redis)
    CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_valid BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Qualifications table
    CREATE TABLE IF NOT EXISTS qualifications (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE,
        description TEXT,
        category VARCHAR(100),
        level INTEGER,
        expiration_period INTEGER, -- In months, null if doesn't expire
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- User qualifications table
    CREATE TABLE IF NOT EXISTS user_qualifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        qualification_id INTEGER NOT NULL REFERENCES qualifications(id) ON DELETE CASCADE,
        date_acquired DATE NOT NULL,
        expiration_date DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expired, revoked, pending
        issuing_authority VARCHAR(255),
        certificate_number VARCHAR(100),
        verification_document VARCHAR(255), -- file path/URL to uploaded certificate
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, qualification_id) -- Optional: prevent duplicates
    );

    -- Work roles table
    CREATE TABLE IF NOT EXISTS work_roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE,
        description TEXT,
        department_id INTEGER REFERENCES departments(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- User work roles table
    CREATE TABLE IF NOT EXISTS user_work_roles (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        work_role_id INTEGER NOT NULL REFERENCES work_roles(id) ON DELETE CASCADE,
        primary_role BOOLEAN DEFAULT FALSE, -- Is this the user's primary work role
        start_date DATE NOT NULL,
        end_date DATE, -- Null for current assignments
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, work_role_id)
    );

    -- Qualification requirements table
    CREATE TABLE IF NOT EXISTS qualification_requirements (
        id SERIAL PRIMARY KEY,
        work_role_id INTEGER NOT NULL REFERENCES work_roles(id) ON DELETE CASCADE,
        qualification_id INTEGER NOT NULL REFERENCES qualifications(id) ON DELETE CASCADE,
        is_required BOOLEAN DEFAULT TRUE, -- Required vs. recommended
        priority INTEGER DEFAULT 0, -- Higher number = higher priority
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(work_role_id, qualification_id)
    );

    -- Qualification updates table
    CREATE TABLE IF NOT EXISTS qualification_updates (
        id SERIAL PRIMARY KEY,
        user_qualification_id INTEGER NOT NULL REFERENCES user_qualifications(id) ON DELETE CASCADE,
        updated_by_user_id INTEGER NOT NULL REFERENCES users(id),
        previous_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        previous_expiration_date DATE,
        new_expiration_date DATE,
        update_reason TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
    // Execute the schema SQL
    await (0, index_1.query)(schemaSQL);
    console.log('Tables created successfully');
}
async function down() {
    const dropTablesSQL = `
    DROP TABLE IF EXISTS qualification_updates;
    DROP TABLE IF EXISTS qualification_requirements;
    DROP TABLE IF EXISTS user_work_roles;
    DROP TABLE IF EXISTS work_roles;
    DROP TABLE IF EXISTS user_qualifications;
    DROP TABLE IF EXISTS qualifications;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS user_roles;
    DROP TABLE IF EXISTS user_credentials;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS role_permissions;
    DROP TABLE IF EXISTS permissions;
    DROP TABLE IF EXISTS roles;
    DROP TABLE IF EXISTS departments;
    DROP TABLE IF EXISTS organisations;
  `;
    await (0, index_1.query)(dropTablesSQL);
    console.log('Tables dropped successfully');
}
//# sourceMappingURL=001_create_tables.js.map