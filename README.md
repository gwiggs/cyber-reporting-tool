# Cyber Reporting Tool

A full-stack application for managing and reporting cybersecurity incidents.

## Project Structure

```
project-root/
├── frontend/                  # React frontend application (TypeScript)
├── backend/                   # Node.js Express backend (TypeScript)
├── shared/                    # Shared code between frontend and backend
└── docker/                    # Docker configuration
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Docker (optional)

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/cyber_reporting
   JWT_SECRET=your-secret-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:3000`

## Testing

Run tests for both frontend and backend:

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

## Deployment

The application can be deployed using Docker. See the `docker/` directory for configuration details.

## License

MIT
