export default {
  'audit-logs': {
    enabled: true,
    resolve: './src/plugins/audit-logs', // 👈 MUST point to your plugin folder
    config: {
      auditLog: {
        enabled: true,
        excludeContentTypes: ['plugin::users-permissions.user'],
      },
    },
  },
};
