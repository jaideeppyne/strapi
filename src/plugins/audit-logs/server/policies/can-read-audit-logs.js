'use strict';

module.exports = async (ctx, next) => {
  const user = ctx.state?.user;
  if (!user) return ctx.unauthorized('Authentication required');

  const directFlag =
    user.read_audit_logs === true ||
    (Array.isArray(user.permissions) && user.permissions.includes('read_audit_logs'));

  const roles = [];
  if (Array.isArray(user.roles)) roles.push(...user.roles);
  else if (user.role) roles.push(user.role);

  const roleFlag = roles.some(role => {
    if (!role) return false;
    if (role.read_audit_logs === true) return true;
    if (Array.isArray(role.permissions)) {
      return role.permissions.includes('read_audit_logs');
    }
    return false;
  });

  if (!(directFlag || roleFlag)) return ctx.forbidden('Missing permission: read_audit_logs');

  await next();
};
