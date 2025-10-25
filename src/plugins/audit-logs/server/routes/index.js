'use strict';

const contentApiRoutes = require('./content-api/audit-logs');

module.exports = {
  'content-api': {
    type: 'content-api',
    routes: contentApiRoutes,
  },
};

