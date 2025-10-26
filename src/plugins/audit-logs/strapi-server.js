'use strict';

const plugin = require('./server');

module.exports = () => {
  const pluginAPI = plugin();

  return {
    ...pluginAPI,

    register({ strapi }) {
      // nothing to do at register-time for now
    },

    bootstrap({ strapi }) {
      strapi.log.info('[audit-logs] bootstrap starting');
      strapi.log.info('[audit-logs] plugin base URL should be /api/audit-logs');

      const getCfg = () =>
        strapi.config.get('plugin.audit-logs.auditLog', {
          enabled: true,
          excludeContentTypes: [],
        });
      const AUDIT_LOG_UID = 'plugin::audit-logs.audit-log';

      const cfg = getCfg();
      if (!cfg.enabled) return;

      const shouldSkip = uid => {
        if (!uid) return true;
        const latestCfg = getCfg();
        return (
          latestCfg.excludeContentTypes.includes(uid) ||
          uid === AUDIT_LOG_UID ||
          latestCfg.enabled === false
        );
      };

      // Subscribe to all model lifecycles
      strapi.log.info('[audit-logs] registering lifecycle subscription');
      strapi.db.lifecycles.subscribe({
        models: ['*'],

        async beforeUpdate(event) {
          const { model, params } = event;
          const uid = model?.uid || model;
          const id = params?.where?.id;
          if (!id || shouldSkip(uid)) return;

          event.state = event.state || {};
          try {
            const before = await strapi.entityService.findOne(uid, id, { populate: {} });
            event.state.__audit_before = before;
          } catch (error) {
            strapi.log.debug(`[audit-logs] failed to fetch entity before update: ${error.message}`);
          }
        },

        async beforeDelete(event) {
          const { model, params } = event;
          const uid = model?.uid || model;
          const id = params?.where?.id;
          if (!id || shouldSkip(uid)) return;

          event.state = event.state || {};
          try {
            const before = await strapi.entityService.findOne(uid, id, { populate: {} });
            event.state.__audit_before = before;
          } catch (error) {
            strapi.log.debug(`[audit-logs] failed to fetch entity before delete: ${error.message}`);
          }
        },

        async afterCreate(event) {
          await logChange('create', event);
        },

        async afterUpdate(event) {
          await logChange('update', event);
        },

        async afterDelete(event) {
          await logChange('delete', event);
        },
      });

      async function logChange(action, event) {
        strapi.log.info(`[audit-logs][debug] attempting to log ${action}`);
        const latestCfg = getCfg();
        if (!latestCfg.enabled) return;

        const { model, result, params, state } = event;
        const uid = model?.uid || model;

        // Skip excluded & our own plugin type
        if (shouldSkip(uid)) return;

        // Only log changes coming from an actual HTTP request (Content API)
        const koaCtx = strapi.requestContext.get();
        if (!koaCtx) return;

        const user = koaCtx.state?.user || null;
        const recordId = (result && result.id) || params?.where?.id || null;

        let payload = null;
        let diff = null;

        try {
          if (action === 'create') {
            payload = sanitize(result);
          } else if (action === 'update') {
            const before = sanitize(state?.__audit_before || null);
            const after = sanitize(result || null);
            diff = computeDiff(before, after);
          } else if (action === 'delete') {
            const before = sanitize(state?.__audit_before || null);
            payload = before || (recordId ? { deletedId: recordId } : null);
          }
        } catch (error) {
          strapi.log.debug(`[audit-logs] unable to compute payload/diff: ${error.message}`);
        }

        await strapi.entityService.create(AUDIT_LOG_UID, {
          data: {
            contentType: uid,
            recordId,
            action,
            timestamp: new Date().toISOString(),
            userId: user?.id || null,
            username: user?.username || user?.email || null,
            changedFields: diff?.changedFields || [],
            diff: diff || null,
            payload: payload || null,
          },
        });
      }

      function sanitize(entity) {
        if (!entity) return null;
        const clone = { ...entity };
        delete clone.password;
        delete clone.resetPasswordToken;
        delete clone.confirmationToken;
        return clone;
      }

      function computeDiff(before, after) {
        if (!before || !after) {
          return { changedFields: [], before: before || null, after: after || null };
        }
        const changedFields = [];
        const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
        for (const k of keys) {
          const bv = before[k];
          const av = after[k];
          const simple =
            (typeof bv !== 'object' && typeof av !== 'object') ||
            bv === null ||
            av === null ||
            Array.isArray(bv) ||
            Array.isArray(av);
          if (simple && bv !== av) changedFields.push(k);
        }
        return {
          changedFields,
          before: pick(before, changedFields),
          after: pick(after, changedFields),
        };
      }

      function pick(obj, keys) {
        const out = {};
        for (const k of keys) out[k] = obj?.[k];
        return out;
      }
    },
  };
};
