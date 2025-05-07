"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Service for handling email operations
 * Note: This is a mock implementation since we don't have actual email sending capability
 * In a production environment, this would use a real email service like SendGrid, Mailgun, etc.
 */
const emailService = {
    /**
     * Send password reset email
     * @param to Email address to send to
     * @param resetToken Password reset token
     * @param resetUrl Frontend URL for password reset
     */
    async sendPasswordResetEmail(to, resetToken, resetUrl) {
        // In a real implementation, this would send an actual email
        // For now, we'll just log the information
        console.log(`
        [MOCK EMAIL SERVICE]
        TO: ${to}
        SUBJECT: Password Reset
        BODY:
        ====================================
        You requested a password reset for your account.
        
        Please use the following link to reset your password:
        ${resetUrl}?token=${resetToken}
        
        This link will expire in 24 hours.
        
        If you did not request a password reset, please ignore this email.
        ====================================
      `);
        // In a real implementation, we would return a promise from the email service
        return Promise.resolve();
    },
    /**
     * Send welcome email to new user
     * @param to Email address to send to
     * @param name User's name
     * @param password Temporary password (if applicable)
     */
    async sendWelcomeEmail(to, name, password) {
        // In a real implementation, this would send an actual email
        // For now, we'll just log the information
        console.log(`
        [MOCK EMAIL SERVICE]
        TO: ${to}
        SUBJECT: Welcome to Cyber Reporting Tool
        BODY:
        ====================================
        Welcome ${name}!
        
        Your account has been created on the Cyber Reporting Tool.
        ${password ? `Your temporary password is: ${password}` : ''}
        
        Please login to the system and update your password.
        ====================================
      `);
        // In a real implementation, we would return a promise from the email service
        return Promise.resolve();
    }
};
exports.default = emailService;
//# sourceMappingURL=emailService.js.map