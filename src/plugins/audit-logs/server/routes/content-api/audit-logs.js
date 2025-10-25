'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: 'auditLog.find',
    config: {
      policies: ['plugin::audit-logs.can-read-audit-logs'],
      auth: false, // policy will enforce permission
    },
  },
];
