'use strict';

const AUDIT_LOG_PERMISSION = 'plugin::audit-logs.audit-log.read_audit_logs';

module.exports = async (ctx, next) => {
  const user = ctx.state?.user;
  if (!user) return ctx.unauthorized('Authentication required');

  const hasDirectOverride =
    user.read_audit_logs === true ||
    (Array.isArray(user.permissions) && user.permissions.includes('read_audit_logs'));
  if (hasDirectOverride) {
    await next();
    return;
  }

  const candidateRoles = [];
  if (Array.isArray(user.roles)) candidateRoles.push(...user.roles);
  else if (user.role) candidateRoles.push(user.role);

  const roleIds = candidateRoles
    .map(roleEntry => (typeof roleEntry === 'object' ? roleEntry?.id : roleEntry))
    .filter(Boolean);

  if (roleIds.length === 0) return ctx.forbidden('Missing permission: read_audit_logs');

  const permission = await strapi.db.query('plugin::users-permissions.permission').findOne({
    where: {
      role: roleIds.length > 1 ? { $in: roleIds } : roleIds[0],
      action: AUDIT_LOG_PERMISSION,
    },
  });
  const hasPermission = Boolean(permission);

  if (!hasPermission) return ctx.forbidden('Missing permission: read_audit_logs');

  await next();
};
