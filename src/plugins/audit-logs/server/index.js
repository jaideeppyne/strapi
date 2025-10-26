'use strict';

module.exports = () => ({
  controllers: {
    auditLog: require('./controllers/audit-log'),
  },
  services: {
    auditLog: require('./services/audit-log'),
  },
  policies: {
    'can-read-audit-logs': require('./policies/can-read-audit-logs'),
  },
  contentTypes: require('./content-types'),
});
