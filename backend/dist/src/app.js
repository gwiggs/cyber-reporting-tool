"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const organizationRoutes_1 = __importDefault(require("./routes/organizationRoutes"));
const departmentRoutes_1 = __importDefault(require("./routes/departmentRoutes"));
const permissionRoutes_1 = __importDefault(require("./routes/permissionRoutes"));
const qualificationRoutes_1 = __importDefault(require("./routes/qualificationRoutes"));
const userQualificationRoutes_1 = __importDefault(require("./routes/userQualificationRoutes"));
const workRoleRoutes_1 = __importDefault(require("./routes/workRoleRoutes"));
const qualificationRequirementRoutes_1 = __importDefault(require("./routes/qualificationRequirementRoutes"));
// Initialize express
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Add global error logger
app.use((req, res, next) => {
    const originalSend = res.send;
    // @ts-ignore - Override send method to log errors
    res.send = function (body) {
        const statusCode = res.statusCode;
        if (statusCode >= 500) {
            console.error(`[ERROR] Status: ${statusCode}, Path: ${req.path}, Method: ${req.method}, Body:`, body);
        }
        else if (statusCode >= 400) {
            console.warn(`[WARN] Status: ${statusCode}, Path: ${req.path}, Method: ${req.method}, Body:`, body);
        }
        return originalSend.call(this, body);
    };
    next();
});
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/roles', roleRoutes_1.default);
app.use('/api/organizations', organizationRoutes_1.default);
app.use('/api/departments', departmentRoutes_1.default);
app.use('/api/permissions', permissionRoutes_1.default);
app.use('/api/qualifications', qualificationRoutes_1.default);
app.use('/api/user-qualifications', userQualificationRoutes_1.default);
app.use('/api/work-roles', workRoleRoutes_1.default);
app.use('/api/qualification-requirements', qualificationRequirementRoutes_1.default);
app.use((err, req, res, next) => {
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
exports.default = app;
//# sourceMappingURL=app.js.map