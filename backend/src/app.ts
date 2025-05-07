import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import roleRoutes from './routes/roleRoutes';
import organizationRoutes from './routes/organizationRoutes';
import departmentRoutes from './routes/departmentRoutes';
import permissionRoutes from './routes/permissionRoutes';
import qualificationRoutes from './routes/qualificationRoutes';
import userQualificationRoutes from './routes/userQualificationRoutes';
import workRoleRoutes from './routes/workRoleRoutes';
import qualificationRequirementRoutes from './routes/qualificationRequirementRoutes';

// Initialize express
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Add global error logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  // @ts-ignore - Override send method to log errors
  res.send = function(body) {
    const statusCode = res.statusCode;
    if (statusCode >= 500) {
      console.error(`[ERROR] Status: ${statusCode}, Path: ${req.path}, Method: ${req.method}, Body:`, body);
    } else if (statusCode >= 400) {
      console.warn(`[WARN] Status: ${statusCode}, Path: ${req.path}, Method: ${req.method}, Body:`, body);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/qualifications', qualificationRoutes);
app.use('/api/user-qualifications', userQualificationRoutes);
app.use('/api/work-roles', workRoleRoutes);
app.use('/api/qualification-requirements', qualificationRequirementRoutes);

// Error handling middleware
interface AppError extends Error {
  status?: number;
}

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);
  
  // Add request details to error log
  console.error('Error occurred in request:', {
    path: req.path,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: req.headers,
    // Don't log cookies as they may contain sensitive information
  });
  
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal Server Error' : err.message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;