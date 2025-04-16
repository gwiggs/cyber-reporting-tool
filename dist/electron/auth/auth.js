"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = setupAuth;
const passport = __importStar(require("passport"));
const passport_local_1 = require("passport-local");
const passport_jwt_1 = require("passport-jwt");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const database_1 = require("../database/database");
// JWT secret key - in production this should be an environment variable
const JWT_SECRET = 'your-secret-key-change-in-production';
// Setup authentication
function setupAuth(app) {
    // Initialize Passport
    app.use(passport.initialize());
    // Configure local strategy for username/password authentication
    passport.use(new passport_local_1.Strategy({
        usernameField: 'email',
        passwordField: 'password',
    }, (email, password, done) => __awaiter(this, void 0, void 0, function* () {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            // Find user by email
            const user = yield prisma.user.findUnique({
                where: { email },
            });
            // Check if user exists
            if (!user) {
                return done(null, false, { message: 'Invalid email or password' });
            }
            // Check password
            const isValidPassword = yield bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return done(null, false, { message: 'Invalid email or password' });
            }
            // Return user without password
            const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
            return done(null, userWithoutPassword);
        }
        catch (error) {
            return done(error);
        }
    })));
    // Configure JWT strategy for token authentication
    passport.use(new passport_jwt_1.Strategy({
        jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
    }, (payload, done) => __awaiter(this, void 0, void 0, function* () {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            // Find user by ID from JWT payload
            const user = yield prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user) {
                return done(null, false);
            }
            // Return user without password
            const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
            return done(null, userWithoutPassword);
        }
        catch (error) {
            return done(error);
        }
    })));
    // Login route
    app.post('/api/auth/login', (req, res, next) => {
        passport.authenticate('local', { session: false }, (err, user, info) => {
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
    app.post('/api/auth/register', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            const { email, password, firstName, lastName, role } = req.body;
            // Check if user already exists
            const existingUser = yield prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
            // Hash password
            const hashedPassword = yield bcrypt.hash(password, 10);
            // Create new user
            const newUser = yield prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role,
                },
            });
            // Remove password from response
            const { password: _ } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
            // Generate JWT token
            const token = jwt.sign({ sub: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
            // Return user and token
            return res.status(201).json({
                user: userWithoutPassword,
                token,
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }));
    // Protected route example
    app.get('/api/auth/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
        res.json({ message: 'You have access to this protected route', user: req.user });
    });
    return app;
}
