# Enterprise Task & Resource Management System Setup

This document provides instructions to set up and run the application.

## Prerequisites

- Node.js (version 16 or later)
- npm (version 8 or later)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Create the database:

```bash
npx prisma migrate dev --name init
```

## Development

To run the application in development mode:

```bash
npm run dev
```

This starts both the React development server and the Electron application.

## Building for Production

1. Build the application:

```bash
npm run build
```

2. Package the application:

```bash
npm run package
```

This will create distributable packages for Windows, macOS, and Linux in the `dist` folder.

## Project Structure

- `electron/` - Electron main process code
  - `auth/` - Authentication logic
  - `database/` - Database setup and configuration
- `prisma/` - Database schema and migrations
- `src/` - React frontend
  - `components/` - React components
  - `redux/` - State management
  - `styles/` - CSS and styling
  - `types/` - TypeScript type definitions

## Features Implemented

- Authentication (Login/Register)
- Role-based access control
- Basic dashboard

## TypeScript Configuration

The project uses TypeScript for type safety. Custom type definitions are defined in the `src/types` directory.

If you encounter TypeScript errors related to missing module declarations:

1. Check if the module's type definitions are installed:

```bash
npm install --save-dev @types/module-name
```

2. If types are not available, add custom type declarations in the `src/types/custom.d.ts` file.

3. Make sure the `tsconfig.json` file includes the `typeRoots` option pointing to your custom types directory:

```json
"typeRoots": [
  "./node_modules/@types",
  "./src/types"
]
```

## Next Steps

- Implement task management features
- Add team management functionality
- Create resource allocation components
- Implement SAP integration
- Set up offline sync capabilities 