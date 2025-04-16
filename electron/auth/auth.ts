import * as express from 'express';
import * as passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getPrismaClient } from '../database/database';

// JWT secret key - in production this should be an environment variable
const JWT_SECRET = 'your-secret-key-change-in-production';

// Setup authentication
export function setupAuth(app: express.Application) {
  // Initialize Passport
  app.use(passport.initialize());

  // Configure local strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const prisma = getPrismaClient();
          
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email },
          });

          // Check if user exists
          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Check password
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Configure JWT strategy for token authentication
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const prisma = getPrismaClient();
          
          // Find user by ID from JWT payload
          const user = await prisma.user.findUnique({
            where: { id: payload.sub },
          });

          if (!user) {
            return done(null, false);
          }

          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Login route
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }

      // Generate JWT token
      const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Return user and token
      return res.json({
        user,
        token,
      });
    })(req, res, next);
  });

  // Register route
  app.post('/api/auth/register', async (req, res) => {
    try {
      const prisma = getPrismaClient();
      const { email, password, firstName, lastName, role } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
        },
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      // Generate JWT token
      const token = jwt.sign({ sub: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

      // Return user and token
      return res.status(201).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Protected route example
  app.get(
    '/api/auth/protected',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      res.json({ message: 'You have access to this protected route', user: req.user });
    }
  );

  return app;
} 