# Enterprise Task & Resource Management System

An offline-capable enterprise application for role-based task management, resource allocation, team skills tracking, and SAP integration.

## Technology Stack

### Frontend
- **React.js** with **TypeScript** - Component-based UI framework with type safety
- **Redux** - State management for complex application state
- **Material-UI** - Enterprise-ready component library
- **Gantt Chart Libraries** - Timeline visualization components
- **Electron** - Desktop application wrapper for offline capability

### Backend
- **Node.js** with **Express.js** - JavaScript server runtime and API framework
- **PostgreSQL** (Embedded) - Enterprise-grade relational database
- **Prisma ORM** - Type-safe database access and migrations
- **Passport.js** - Authentication and authorization
- **Electron IPC** - Secure main/renderer process communication

### Security & Integration
- **node-pg-encrypt** - Column-level encryption for PII
- **SAP NetWeaver Gateway Connector** - SAP system integration
- **node-rfc** - SAP RFC integration for direct function calls
- **Bull** - Job queue for background processing and synchronization

## Core Features

- **Role-Based Access Control**
  - Granular permissions system
  - User management and authentication
  - Audit logging of sensitive operations

- **Task Management**
  - Hierarchical tasks and sub-tasks
  - User assignment and tracking
  - Dependency management
  - Status reporting

- **Timeline Visualization**
  - Interactive Gantt charts
  - Resource allocation view
  - Critical path analysis

- **Resource Management**
  - ICT asset inventory
  - Resource allocation and scheduling
  - Utilization reporting

- **Team Skills Management**
  - Skills tracking and gap analysis
  - Training management
  - Certification tracking

- **SAP Integration**
  - Bi-directional data synchronization
  - Conflict resolution
  - Offline operation with delayed sync

## Architecture Overview

The application follows a modular architecture:

```
┌─────────────────────────────────────────┐
│              Electron Shell              │
├─────────────┬───────────────┬───────────┤
│  React UI   │  Node.js API  │PostgreSQL │
│ (Renderer)  │ (Main Process)│ (Embedded)│
├─────────────┴───────────────┴───────────┤
│           Offline Capabilities           │
├─────────────────────────────────────────┤
│            Sync Mechanisms              │
├─────────────────────────────────────────┤
│             SAP Connectors              │
└─────────────────────────────────────────┘
```

## Data Security Approach

### PII Protection
- Column-level encryption for sensitive personal data
- Data masking for display contexts
- Role-based access control to PII fields
- Audit logging of all PII access

### Database Security
- Encrypted database files at rest
- Application-level encryption keys
- Parameterized queries to prevent SQL injection
- Schema-level security controls

## Offline Operation

The application is designed to run fully offline with:

- Local PostgreSQL database for all operations
- Sync queue for pending changes when online
- Conflict resolution strategies for bidirectional sync
- Robust error handling for interrupted syncs

## SAP Integration

Integration with SAP systems is handled through:

1. **Data Synchronization**
   - Scheduled synchronization of master data
   - Change tracking for delta updates
   - Conflict resolution with business rules

2. **Transaction Processing**
   - Queue-based transaction submission
   - Status tracking and error handling
   - Retry mechanisms for failed transactions

3. **Authentication**
   - Secure credential storage
   - OAuth token management
   - Single sign-on where applicable

## Development Workflow

### Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment:
   ```bash
   npm run setup
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Build Instructions

Create distribution packages:
```bash
npm run build
npm run package
```

## Deployment

The application can be deployed as:

- Windows executable (.exe)
- macOS application bundle (.app)
- Linux package (.AppImage)

## License

[Your License Here]
