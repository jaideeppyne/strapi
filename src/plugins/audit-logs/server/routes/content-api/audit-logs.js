'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: 'auditLog.read_audit_logs',
    config: {
      policies: ['plugin::audit-logs.can-read-audit-logs'],
    },
  },
];
