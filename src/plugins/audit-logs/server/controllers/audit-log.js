'use strict';

const CONTENT_API_SYMBOL = Symbol.for('__type__');

const readAuditLogs = async ctx => {
  const { query } = ctx;
  const {
    'filters[contentType][$in]': contentTypes,
    'filters[userId]': userId,
    'filters[action][$in]': actions,
    'filters[dateFrom]': dateFrom,
    'filters[dateTo]': dateTo,
    'pagination[page]': page = 1,
    'pagination[pageSize]': pageSize = 20,
    sort = 'timestamp:desc',
  } = query;

  const where = {};

  if (contentTypes) {
    where.contentType = { $in: Array.isArray(contentTypes) ? contentTypes : [contentTypes] };
  }
  if (userId) where.userId = Number(userId);
  if (actions) where.action = { $in: Array.isArray(actions) ? actions : [actions] };
  if (dateFrom || dateTo) {
    where.timestamp = {};
    if (dateFrom) where.timestamp.$gte = new Date(dateFrom).toISOString();
    if (dateTo) where.timestamp.$lte = new Date(dateTo).toISOString();
  }

  const [sortField = 'timestamp', sortOrder = 'desc'] = String(sort).split(':');
  const orderBy = { [sortField]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' };

  const uid = 'plugin::audit-logs.audit-log';
  const start = (Number(page) - 1) * Number(pageSize);

  const [results, total] = await Promise.all([
    strapi.entityService.findMany(uid, {
      filters: where,
      sort: orderBy,
      limit: Number(pageSize),
      start,
    }),
    strapi.entityService.count(uid, { filters: where }),
  ]);

  ctx.body = {
    data: results,
    meta: {
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        pageCount: Math.ceil(total / Number(pageSize)),
        total,
      },
    },
  };
};

readAuditLogs[CONTENT_API_SYMBOL] = ['content-api'];

module.exports = {
  read_audit_logs: readAuditLogs,
};
