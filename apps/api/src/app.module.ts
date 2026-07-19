import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { AuthModule as BetterAuthNestModule } from "@thallesp/nestjs-better-auth";

import { auth } from "./lib/auth";
import { HealthModule } from "./modules/health/health.module";
import { RbacModule } from "./modules/rbac/rbac.module";
import { WorkspacesModule } from "./modules/workspaces/workspaces.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { ActivityModule } from "./modules/activity/activity.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { CrmModule } from "./modules/crm/crm.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { FilesModule } from "./modules/files/files.module";
import { KnowledgeModule } from "./modules/knowledge/knowledge.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { BillingModule } from "./modules/billing/billing.module";
import { AiModule } from "./modules/ai/ai.module";

@Module({
  imports: [
    // wildcard: true + delimiter: "." lets ActivityModule's listener
    // subscribe to every domain event ("task.created", "deal.stage_changed",
    // ...) via a single @OnEvent("**") — see docs/PHASE_0_ARCHITECTURE.md §2.
    EventEmitterModule.forRoot({ wildcard: true, delimiter: "." }),

    // Mounts Better Auth's own routes (sign-up, sign-in, organization CRUD,
    // invitations, 2FA — see apps/api/src/lib/auth.ts) as Nest controllers.
    // disableGlobalAuthGuard: true because this codebase's own
    // PermissionGuard/AuthGuard/OrgRoleGuard (modules/rbac) handle both
    // authentication and fine-grained workspace/org authorization together —
    // see the design note in modules/rbac/guards/permission.guard.ts. Not
    // yet smoke-tested against a live server; see CHANGELOG.
    BetterAuthNestModule.forRoot({ auth, disableGlobalAuthGuard: true }),

    HealthModule,
    RbacModule,

    // Core Platform
    OrganizationsModule,
    WorkspacesModule,

    // Work Management (Phase 2)
    ProjectsModule,
    TasksModule,
    CommentsModule,
    AttachmentsModule,
    ActivityModule,

    // CRM & Sales (Phase 3)
    CrmModule,

    // Knowledge & Documents (Phase 4)
    DocumentsModule,
    FilesModule,
    KnowledgeModule,

    // Finance & Billing (Phase 5)
    FinanceModule,
    BillingModule,

    // AI Layer (Phase 6)
    AiModule,
  ],
})
export class AppModule {}
