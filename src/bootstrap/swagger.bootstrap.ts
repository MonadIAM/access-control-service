import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";

import { name, version } from "../../package.json";

const SWAGGER_TAGS: Record<string, string> = {
    Realm: "Defines multi-tenant boundaries and isolation scopes for resource access.",
    Role: "Lifecycle management for roles, including complex inheritance and hierarchical structures.",
    Permission: "System-wide registry of granular capabilities used for both RBAC and DAC logic.",
    RolePermissionAssignment: "Defines the foundational RBAC mapping between abstract roles and concrete permissions.",
    AccountRoleAssignment: "Management of account-to-role assignments, supporting complex RBAC lifecycle.",
    PermissionOverride: "DAC Provider: Manages explicit permission grants/denials for specific accounts, bypassing roles.",
    RoleDelegationPolicy: "Defines rules and constraints for the elective transfer of roles between accounts.",
    RoleConflictGroup: "SoD Engine: Defines sets of mutually exclusive roles to prevent administrative toxic combinations.",
    RoleConflictMember: "Configures specific roles belonging to a defined Separation of Duties (SoD) group.",
    Invite: "Manages account invitations into realms, including creation, acceptance, declination, and cancellation workflows.",
    AuditLog: "Centralized security log tracking operations, actors, and inputs across RBAC, SoD, and DAC workflows.",
    ChangeLog: "Field-level change history linked to audit entries, capturing before/after deltas for entity mutations.",
    Health: "Service observability probes exposing liveness status and infrastructure readiness across dependent subsystems.",
};

export abstract class BootstrapSwagger {
    private constructor() {}

    public static registerSwagger(application: INestApplication): void {
        if (process.env.NODE_ENV === "development") {
            const description = readFileSync(join(__dirname, "./swagger.md"), "utf-8");

            const config = new DocumentBuilder().setTitle(name).setDescription(description).setVersion(version);

            Object.entries(SWAGGER_TAGS).forEach(([name, description]) => {
                config.addTag(name, description);
            });

            const document = SwaggerModule.createDocument(application, config.build());

            SwaggerModule.setup("/docs", application, document, {
                jsonDocumentUrl: "/docs-json",
                swaggerOptions: {
                    persistAuthorization: true,
                },
            });
        }
    }
}
