/**
 * Seeds:
 *   1. Every Permission key from the RBAC matrix (docs/PHASE_0_ARCHITECTURE.md §4)
 *   2. The 4 system Roles (Owner, Admin, Member, Guest) + their RolePermission links
 *   3. One demo Organization + Workspace
 *   4. If SEED_DEMO_USER_EMAIL is set and that user already exists (sign up
 *      for real first via POST /api/auth/sign-up/email — this script never
 *      creates login credentials itself, see the note below), attaches them
 *      to the demo org/workspace as Owner.
 *
 * Run: `pnpm db:seed` (from repo root). Idempotent — safe to re-run.
 *
 * Why the demo user isn't created here: Better Auth owns password hashing
 * internally, and this script deliberately doesn't reach into that (writing
 * a User/Account row by hand with a guessed hash format is exactly the kind
 * of "looks right, silently broken" shortcut this project has been trying to
 * avoid all session — see CHANGELOG's running list of corrections). Sign up
 * through the real endpoint, then re-run this script.
 */
import { prisma } from "@navicore/db";

// Matches docs/PHASE_0_ARCHITECTURE.md §4 exactly. "own only" / "scoped items
// only" cells are NOT separate permission keys — they're the base permission
// (Member/Guest get it too) plus an ownership check the service layer does
// after PermissionGuard passes. See apps/api/src/modules/rbac/permissions.service.ts.
const PERMISSIONS: Array<{ key: string; module: string; action: string; roles: string[] }> = [
  { key: "org:manage_billing", module: "org", action: "manage_billing", roles: ["Owner"] },
  { key: "org:manage_members", module: "org", action: "manage_members", roles: ["Owner", "Admin"] },
  { key: "org:delete", module: "org", action: "delete", roles: ["Owner"] },

  { key: "workspace:create", module: "workspace", action: "create", roles: ["Owner", "Admin"] },
  { key: "workspace:manage_settings", module: "workspace", action: "manage_settings", roles: ["Owner", "Admin"] },

  { key: "projects:create", module: "projects", action: "create", roles: ["Owner", "Admin", "Member"] },
  { key: "projects:update", module: "projects", action: "update", roles: ["Owner", "Admin", "Member"] },
  { key: "projects:delete", module: "projects", action: "delete", roles: ["Owner", "Admin", "Member"] },
  { key: "projects:manage_members", module: "projects", action: "manage_members", roles: ["Owner", "Admin"] },

  { key: "tasks:create", module: "tasks", action: "create", roles: ["Owner", "Admin", "Member"] },
  { key: "tasks:update", module: "tasks", action: "update", roles: ["Owner", "Admin", "Member"] },
  { key: "tasks:assign", module: "tasks", action: "assign", roles: ["Owner", "Admin", "Member"] },
  { key: "tasks:delete", module: "tasks", action: "delete", roles: ["Owner", "Admin", "Member"] },

  { key: "comments:create", module: "comments", action: "create", roles: ["Owner", "Admin", "Member", "Guest"] },
  { key: "comments:delete_any", module: "comments", action: "delete_any", roles: ["Owner", "Admin"] },

  { key: "crm:companies:create", module: "crm", action: "companies:create", roles: ["Owner", "Admin", "Member"] },
  { key: "crm:companies:update", module: "crm", action: "companies:update", roles: ["Owner", "Admin", "Member"] },
  { key: "crm:companies:delete", module: "crm", action: "companies:delete", roles: ["Owner", "Admin", "Member"] },
  { key: "crm:contacts:create", module: "crm", action: "contacts:create", roles: ["Owner", "Admin", "Member"] },
  { key: "crm:contacts:update", module: "crm", action: "contacts:update", roles: ["Owner", "Admin", "Member"] },
  { key: "crm:contacts:delete", module: "crm", action: "contacts:delete", roles: ["Owner", "Admin", "Member"] },

  { key: "deals:create", module: "deals", action: "create", roles: ["Owner", "Admin", "Member"] },
  { key: "deals:update", module: "deals", action: "update", roles: ["Owner", "Admin", "Member"] },
  { key: "deals:manage_pipeline_stages", module: "deals", action: "manage_pipeline_stages", roles: ["Owner", "Admin"] },

  { key: "activity:read", module: "activity", action: "read", roles: ["Owner", "Admin", "Member", "Guest"] },

  // Phases 4-6 additions beyond the original §4 matrix — same shape,
  // documented here rather than back-editing the architecture doc's table.
  { key: "documents:create", module: "documents", action: "create", roles: ["Owner", "Admin", "Member"] },
  { key: "documents:update", module: "documents", action: "update", roles: ["Owner", "Admin", "Member"] },
  { key: "documents:delete", module: "documents", action: "delete", roles: ["Owner", "Admin"] },
  { key: "documents:approve", module: "documents", action: "approve", roles: ["Owner", "Admin"] },
  { key: "files:upload", module: "files", action: "upload", roles: ["Owner", "Admin", "Member"] },
  { key: "files:delete", module: "files", action: "delete", roles: ["Owner", "Admin"] },
  { key: "knowledge:create", module: "knowledge", action: "create", roles: ["Owner", "Admin", "Member"] },
  { key: "knowledge:publish", module: "knowledge", action: "publish", roles: ["Owner", "Admin"] },

  { key: "invoices:create", module: "finance", action: "invoices:create", roles: ["Owner", "Admin"] },
  { key: "invoices:update", module: "finance", action: "invoices:update", roles: ["Owner", "Admin"] },
  { key: "invoices:delete", module: "finance", action: "invoices:delete", roles: ["Owner"] },
  { key: "expenses:create", module: "finance", action: "expenses:create", roles: ["Owner", "Admin", "Member"] },
  { key: "expenses:approve", module: "finance", action: "expenses:approve", roles: ["Owner", "Admin"] },
  { key: "budgets:manage", module: "finance", action: "budgets:manage", roles: ["Owner", "Admin"] },
  { key: "billing:manage", module: "finance", action: "billing:manage", roles: ["Owner"] },

  { key: "ai:use_assistant", module: "ai", action: "use_assistant", roles: ["Owner", "Admin", "Member"] },

  // Phase 7 additions. api-keys deliberately has no entry here — it's
  // org-scoped via OrgRoleGuard (organizations/:organizationId/api-keys),
  // not workspace-scoped via PermissionGuard, so it isn't part of this
  // workspace-level Role/Permission matrix at all. See ApiKeysController.
  { key: "automation:manage", module: "automation", action: "manage", roles: ["Owner", "Admin"] },
  { key: "webhooks:manage", module: "webhooks", action: "manage", roles: ["Owner", "Admin"] },
  { key: "channels:manage", module: "channels", action: "manage", roles: ["Owner", "Admin", "Member"] },
  { key: "analytics:manage_reports", module: "analytics", action: "manage_reports", roles: ["Owner", "Admin", "Member"] },
];

const SYSTEM_ROLES = ["Owner", "Admin", "Member", "Guest"] as const;

async function main() {
  console.log("Seeding permissions...");
  const permissionRecords = new Map<string, { id: string }>();
  for (const p of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: p.key },
      update: { module: p.module, action: p.action },
      create: { key: p.key, module: p.module, action: p.action },
    });
    permissionRecords.set(p.key, record);
  }
  console.log(`  ${PERMISSIONS.length} permissions ready.`);

  console.log("Seeding system roles...");
  const roleRecords = new Map<string, { id: string }>();
  for (const name of SYSTEM_ROLES) {
    // Not a plain upsert: Role's compound unique is [organizationId, name],
    // and organizationId is nullable for system roles. Postgres doesn't
    // enforce uniqueness across multiple NULLs in a composite unique index,
    // so a system role's uniqueness here is guaranteed by this script being
    // the only writer of system roles, not a DB-level constraint — see
    // TECH_DEBT.md. findFirst+create/update sidesteps relying on Prisma's
    // generated compound-unique input type accepting null cleanly, which
    // this sandbox couldn't verify against a real generated client.
    const existing = await prisma.role.findFirst({
      where: { organizationId: null, name },
    });
    const record = existing
      ? await prisma.role.update({ where: { id: existing.id }, data: { isSystem: true } })
      : await prisma.role.create({ data: { organizationId: null, name, isSystem: true } });
    roleRecords.set(name, record);
  }
  console.log(`  ${SYSTEM_ROLES.length} system roles ready.`);

  console.log("Linking role -> permission...");
  let linkCount = 0;
  for (const p of PERMISSIONS) {
    const permission = permissionRecords.get(p.key)!;
    for (const roleName of p.roles) {
      const role = roleRecords.get(roleName)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
      linkCount++;
    }
  }
  console.log(`  ${linkCount} role-permission links ready.`);

  console.log("Seeding demo organization + workspace...");
  const org = await prisma.organization.upsert({
    where: { slug: "navicore-demo" },
    update: {},
    create: { name: "NAVICORE Demo", slug: "navicore-demo" },
  });
  const workspace = await prisma.workspace.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "product" } },
    update: {},
    create: { organizationId: org.id, name: "Product Team", slug: "product" },
  });
  // A starter Kanban pipeline for CRM deals and a starter project so the
  // demo workspace isn't empty on first login.
  await prisma.pipelineStage.upsert({
    where: { workspaceId_order: { workspaceId: workspace.id, order: 0 } },
    update: {},
    create: { workspaceId: workspace.id, name: "Lead", order: 0, probability: 10 },
  });
  await prisma.pipelineStage.upsert({
    where: { workspaceId_order: { workspaceId: workspace.id, order: 1 } },
    update: {},
    create: { workspaceId: workspace.id, name: "Qualified", order: 1, probability: 40 },
  });
  await prisma.pipelineStage.upsert({
    where: { workspaceId_order: { workspaceId: workspace.id, order: 2 } },
    update: {},
    create: { workspaceId: workspace.id, name: "Negotiation", order: 2, probability: 70 },
  });
  await prisma.pipelineStage.upsert({
    where: { workspaceId_order: { workspaceId: workspace.id, order: 3 } },
    update: {},
    create: { workspaceId: workspace.id, name: "Closed", order: 3, probability: 100 },
  });
  console.log(`  Organization "${org.slug}" / Workspace "${workspace.slug}" ready.`);

  const demoEmail = process.env.SEED_DEMO_USER_EMAIL;
  if (demoEmail) {
    const user = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!user) {
      console.log(
        `\nSEED_DEMO_USER_EMAIL=${demoEmail} is set, but no such user exists yet.\n` +
          `Sign up first: POST /api/auth/sign-up/email { email: "${demoEmail}", password: "...", name: "..." }\n` +
          `then re-run \`pnpm db:seed\`.`,
      );
    } else {
      const ownerRole = roleRecords.get("Owner")!;
      await prisma.member.upsert({
        where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
        update: { role: "owner" },
        create: { organizationId: org.id, userId: user.id, role: "owner" },
      });
      await prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
        update: { roleId: ownerRole.id },
        create: { workspaceId: workspace.id, userId: user.id, roleId: ownerRole.id },
      });
      console.log(`  Attached ${demoEmail} to the demo org/workspace as Owner.`);
    }
  } else {
    console.log(
      "\nNo SEED_DEMO_USER_EMAIL set — skipping demo-user attachment. " +
        "Set it and re-run to attach an existing account to the demo workspace.",
    );
  }

  console.log("\nSeed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
