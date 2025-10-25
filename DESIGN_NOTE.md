# Audit Logging Design Summary

## Objectives
- Capture immutable audit records for every create, update, and delete executed via the Content API.
- Provide a filterable REST API for investigators while keeping the feature configurable and secure.

## Architecture
1. **Plugin registration**  
   The custom plugin lives in `src/plugins/audit-logs`. `config/plugins.ts` enables it and provides the `auditLog` config object (feature toggle + exclusion list). All server-only logic resides in `strapi-server.js`.

2. **Lifecycle interception**  
   `strapi.db.lifecycles.subscribe({ models: ['*'], ... })` attaches global listeners.  
   - `beforeUpdate` fetches the current entity and stores it on `event.state.__audit_before` so we can compute diffs post-update.  
   - `afterCreate` / `afterUpdate` / `afterDelete` call `logChange`, but only when the mutation was triggered by an HTTP request (checked via `strapi.requestContext.get()`), ensuring internal/background jobs stay noise-free.  
   - Each audit entry stores the sanitized payload (create/delete) or a targeted diff (update) and references the acting user when available.

3. **Data model**  
   The collection type `plugin::audit-logs.audit-log` persists records in the `audit_logs` table with indexes on frequently queried fields (`contentType`, `recordId`, `action`, `timestamp`, `userId`). JSON columns hold `changedFields`, `diff`, and `payload`.

4. **Content API**  
   `server/routes/index.js` registers `GET /api/audit-logs`. The controller builds Strapi-style filters, pagination, and sorting, then responds with `{ data, meta.pagination }`. Supported filters include content type, user id, action, and ISO date ranges.

5. **Security**  
   The policy `plugin::audit-logs.can-read-audit-logs` checks authentication and ensures the user (or any of their roles) exposes a `read_audit_logs` permission/flag before allowing access to the endpoint. This keeps the API disabled for public traffic while letting teams model access however they choose inside Users & Permissions.

## Configuration & Extensibility
- `auditLog.enabled`: quick kill-switch if logging must be paused.
- `auditLog.excludeContentTypes`: array of model UIDs to omit (e.g., sensitive credentials).
- Sanitization helper strips common secrets (`password`, `resetPasswordToken`, etc.) before storing payloads.
- `computeDiff` intentionally limits itself to shallow comparisons for clarity and performance. Complex relational diffs can be added later if necessary.

## Tradeoffs & Future Enhancements
- **Diff depth**: nested objects/relations are treated as opaque blobs; extending diffing to deep structures would require more expensive traversal logic.
- **RBAC source of truth**: the policy accepts either direct user flags or role-scoped permissions named `read_audit_logs`. If your org relies strictly on Strapi's Users & Permissions plugin, consider seeding a dedicated role or augmenting the role model with that flag.
- **Storage growth**: audit logs can grow quickly. Pair this feature with retention tooling (cron job or database TTL) if storage is a concern.

