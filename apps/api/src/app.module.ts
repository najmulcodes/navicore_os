import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
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
import { AutomationModule } from "./modules/automation/automation.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { ApiKeysModule } from "./modules/api-keys/api-keys.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { ChannelsModule } from "./modules/channels/channels.module";
import { ChatModule } from "./modules/chat/chat.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuditModule } from "./modules/audit/audit.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";

@Module({
  imports: [
    // wildcard: true + delimiter: "." lets ActivityModule's listener
    // subscribe to every domain event ("task.created", "deal.stage_changed",
    // ...) via a single @OnEvent("**") — see docs/PHASE_0_ARCHITECTURE.md §2.
    EventEmitterModule.forRoot({ wildcard: true, delimiter: "." }),

    // Production hardening (Phase 10): rate limiting per IP. Per-org rate
    // limiting (also called for in docs/PHASE_0_ARCHITECTURE.md's Security
    // section) would need a custom tracker keyed by the resolved session's
    // organizationId/API key rather than IP — not implemented this pass,
    // see TECH_DEBT.md. Health check and Stripe's webhook are exempted via
    // @SkipThrottle() on their controllers (load balancer probes and
    // Stripe's own retry bursts shouldn't count against the same limit as
    // ordinary API traffic).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

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

    // Automation & Integrations (Phase 7)
    AutomationModule,
    WebhooksModule,
    ApiKeysModule,

    // Collaboration (Phase 8)
    RealtimeModule,
    ChannelsModule,
    ChatModule,

    // Analytics & Reporting (Phase 9)
    AnalyticsModule,

    // Enterprise & Hardening (Phase 10)
    AuditModule,
    IntegrationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
