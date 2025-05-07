"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
exports.belongsToOrganization = belongsToOrganization;
exports.isAdmin = isAdmin;
/**
 * Middleware to check if user has required permission
 * @param requiredPermission The permission required for the operation (e.g., 'user:read')
 */
function authorize(requiredPermission) {
    return (req, res, next) => {
        // Cast to authenticated request (which has user property)
        const authReq = req;
        // Check if request has user property (should be set by authenticate middleware)
        if (!authReq.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }
        // Check if user has the required permission
        const hasPermission = authReq.user.permissions.some((permission) => `${permission.resource}:${permission.action}` === requiredPermission);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
        }
        next();
    };
}
/**
 * Middleware to check if user belongs to specified organization
 * Can be used with or after authorize middleware for organization-specific resources
 */
function belongsToOrganization() {
    return (req, res, next) => {
        const authReq = req;
        // Organization ID from the route or query
        let orgId = null;
        // First check the request parameters (e.g., /organizations/:id/...)
        if (req.params.organizationId) {
            orgId = parseInt(req.params.organizationId);
        }
        else if (req.params.orgId) {
            orgId = parseInt(req.params.orgId);
        }
        // If not in params, check if it's in the body (for POST/PUT requests)
        if (!orgId && req.body && req.body.organization_id) {
            orgId = parseInt(req.body.organization_id);
        }
        // If there's no organization ID to check, just proceed
        if (!orgId) {
            return next();
        }
        // Check if user belongs to this organization (or is admin)
        const isAdmin = authReq.user.role === 'Administrator';
        const belongsToOrg = authReq.user.organisation_id === orgId;
        if (!isAdmin && !belongsToOrg) {
            return res.status(403).json({
                success: false,
                message: 'Access restricted to organization members',
            });
        }
        next();
    };
}
/**
 * Middleware to check if user is an administrator
 */
function isAdmin() {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }
        if (authReq.user.role !== 'Administrator') {
            return res.status(403).json({
                success: false,
                message: 'Administrator access required',
            });
        }
        next();
    };
}
//# sourceMappingURL=rbacMiddleware.js.map