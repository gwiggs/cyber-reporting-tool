"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignRandomPasswordIfNeeded = exports.validatePasswordStrength = void 0;
const passwordService_1 = __importDefault(require("../services/passwordService"));
/**
 * Middleware to enforce password policy
 * This validates that passwords meet the system's security requirements
 */
const validatePasswordStrength = (req, res, next) => {
    // Get password from request body
    const { password } = req.body;
    // If no password in request, skip validation
    if (!password) {
        return next();
    }
    // Validate password strength
    const validationResult = passwordService_1.default.validatePasswordStrength(password);
    if (!validationResult.isValid) {
        res.status(400).json({
            message: 'Password does not meet security requirements',
            errors: validationResult.feedback,
            score: validationResult.score
        });
        return;
    }
    // Password meets requirements, proceed
    next();
};
exports.validatePasswordStrength = validatePasswordStrength;
/**
 * Middleware to assign a random password if none provided
 * This is useful for admin-created accounts where users will reset their password later
 */
const assignRandomPasswordIfNeeded = (req, res, next) => {
    // If password is not provided in the request
    if (!req.body.password) {
        // Generate a secure random password
        const randomPassword = passwordService_1.default.generateRandomPassword({
            length: 14,
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSpecials: true
        });
        // Assign to request body
        req.body.password = randomPassword;
        // Store the generated password so we can return it in the response
        // This will only be returned once during account creation
        req.generatedPassword = randomPassword;
    }
    next();
};
exports.assignRandomPasswordIfNeeded = assignRandomPasswordIfNeeded;
//# sourceMappingURL=passwordMiddleware.js.map