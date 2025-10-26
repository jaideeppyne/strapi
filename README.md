# 🚀 Getting started with Strapi

## 🔍 Automated Audit Logging

This project embeds a custom `audit-logs` plugin that writes an audit entry for every Content API create, update, or delete.

- **Captured fields**: content type UID, record id, action, timestamp, user id/name, changed fields, plus payload/diff snapshots depending on the action.
- **Lifecycle hook**: a global `strapi.db.lifecycles.subscribe` listener inspects each ORM mutation that originates from an HTTP request and persists the audit record in the `audit_logs` table.
- **Deletion snapshots**: delete events store a sanitized copy of the record that was removed so investigators can review the final state.
- **Configuration**: `config/plugins.ts` controls `auditLog.enabled` and `auditLog.excludeContentTypes` so you can disable logging entirely or skip sensitive models.
- **API**: `GET /api/audit-logs` supports filtering by content type, user id, action, date range (`filters[dateFrom]` / `filters[dateTo]`), pagination (`pagination[page]`, `pagination[pageSize]`), and sorting via `sort=<field>:<order>`.
- **Security**: access requires the `read_audit_logs` permission enforced by the `plugin::audit-logs.can-read-audit-logs` policy. Grant this permission to a role from *Settings → Users & Permissions → Roles → (role) → Audit Logs → read_audit_logs* or override it per-user via a `read_audit_logs: true` flag.

Example configuration (`config/plugins.ts`):

```ts
export default {
  'audit-logs': {
    enabled: true,
    resolve: './src/plugins/audit-logs',
    config: {
      auditLog: {
        enabled: true,
        excludeContentTypes: ['plugin::users-permissions.user'],
      },
    },
  },
};
```

Example request:

```
GET /api/audit-logs?filters[contentType][$in]=api::article.article&filters[action][$in]=update&filters[dateFrom]=2024-01-01&pagination[page]=1&pagination[pageSize]=25&sort=timestamp:desc
Authorization: Bearer <token with read_audit_logs permission>
```

If you receive `Missing permission: read_audit_logs`, revisit the role settings above and toggle the `read_audit_logs` action for the appropriate role(s).

Responses follow the standard Strapi `{ data, meta.pagination }` envelope. For deeper architectural details see `DESIGN_NOTE.md`.

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
