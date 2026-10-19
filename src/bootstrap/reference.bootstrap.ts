import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import apiReference from "@scalar/fastify-api-reference";
import { readFileSync } from "fs";
import { join } from "path";

import packageJson from "~root/package.json";

const PAGE_TITLE = "MonadIAM | API Docs";
const DOCUMENT_SLUG = "access-control";
const SECURITY_SCHEME = "identity";
const DOCUMENT_ROUTE = "/openapi.json";
const REFERENCE_ROUTE = "/docs";

const REFERENCE_TAGS: Record<string, string> = {
    Realm: "Defines multi-tenant boundaries and isolation scopes for resource access.",
    Role: "Lifecycle management for roles, including complex inheritance and hierarchical structures.",
    Permission: "System-wide registry of granular capabilities used for both RBAC and DAC logic.",
    RolePermissionAssignment: "Defines the foundational RBAC mapping between abstract roles and concrete permissions.",
    AccountRoleAssignment: "Management of account-to-role assignments, supporting complex RBAC lifecycle.",
    PermissionOverride: "DAC Provider: Manages explicit permission grants/denials for specific accounts, bypassing roles.",
    RoleDelegationPolicy: "Defines rules and constraints for the elective transfer of roles between accounts.",
    RoleConflictGroup: "SoD Engine: Defines sets of mutually exclusive roles to prevent administrative toxic combinations.",
    RoleConflictMember: "Configures specific roles belonging to a defined Separation of Duties (SoD) group.",
    AuditLog: "Centralized security log tracking operations, actors, and inputs across RBAC, SoD, and DAC workflows.",
    ChangeLog: "Field-level change history linked to audit entries, capturing before/after deltas for entity mutations.",
    Health: "Service observability probes exposing liveness status and infrastructure readiness across dependent subsystems.",
};

const SCOPE_DESCRIPTIONS: Record<string, string> = {
    profile: "Read profile claims: name, picture, locale, and time zone.",
    openid: "Issue an ID token and allow the UserInfo endpoint.",
    email: "Read the email claim and its verification state.",
};

export abstract class BootstrapReference {
    private constructor() {}

    public static async registerReference(application: NestFastifyApplication): Promise<void> {
        const description = readFileSync(join(process.cwd(), "src/assets/description.md"), "utf-8");
        const favicon = readFileSync(join(process.cwd(), "src/assets/favicon.svg"), "utf-8");

        const config = new DocumentBuilder()
            .setDescription(description)
            .setVersion(packageJson.version)
            .setTitle(packageJson.name)
            .addServer(process.env.ACCESS_CONTROL_SERVICE_URL)
            .addOAuth2(this.securityScheme(), SECURITY_SCHEME)
            .addSecurityRequirements(SECURITY_SCHEME);

        Object.entries(REFERENCE_TAGS).forEach(([name, description]) => {
            config.addTag(name, description);
        });

        const document = SwaggerModule.createDocument(application, config.build());

        this.publishDocument(application, document);

        await application.register(apiReference, {
            routePrefix: REFERENCE_ROUTE,
            configuration: {
                pageTitle: PAGE_TITLE,
                favicon: `data:image/svg+xml;base64,${Buffer.from(favicon).toString("base64")}`,
                showDeveloperTools: "never",
                proxyUrl: "",
                sources: this.sources(document),
                agent: { disabled: true },
                mcp: { disabled: true },
                withDefaultFonts: false,
                hideClientButton: true,
                persistAuth: true,
            },
        });
    }

    private static publishDocument(application: NestFastifyApplication, document: object): void {
        application
            .getHttpAdapter()
            .getInstance()
            .route({
                method: "GET",
                url: `${REFERENCE_ROUTE}${DOCUMENT_ROUTE}`,
                handler: (_request, reply) => reply.send(document),
            });
    }

    private static sources(document: object): Bootstrap.Reference.Source[] {
        return [
            { slug: "access-control", title: "AccessControl", origin: process.env.ACCESS_CONTROL_SERVICE_URL },
            { slug: "notification", title: "Notification", origin: process.env.NOTIFICATION_SERVICE_URL },
            { slug: "organization", title: "Organization", origin: process.env.ORGANIZATION_SERVICE_URL },
            { slug: "identity", title: "Identity", origin: process.env.IDENTITY_SERVICE_URL },
            { slug: "hr", title: "HR", origin: process.env.HR_SERVICE_URL },
        ].map(({ slug, title, origin }) =>
            slug === DOCUMENT_SLUG
                ? { content: document, title, slug, default: true }
                : { url: `${origin}${REFERENCE_ROUTE}${DOCUMENT_ROUTE}`, title, slug },
        );
    }

    private static securityScheme(): Bootstrap.Reference.SecurityScheme {
        const apiBaseUrl = `${process.env.IDENTITY_SERVICE_URL}/api/v${process.env.API_VERSION}`;

        return {
            type: "oauth2",
            description: "Authenticate through identity-service.",
            "x-default-scopes": Object.keys(SCOPE_DESCRIPTIONS),
            flows: {
                authorizationCode: {
                    "x-scalar-client-id": process.env.DOCS_OAUTH_CLIENT_ID,
                    "x-usePkce": "SHA-256",
                    authorizationUrl: `${apiBaseUrl}/oauth/authorize`,
                    refreshUrl: `${apiBaseUrl}/oauth/token`,
                    tokenUrl: `${apiBaseUrl}/oauth/token`,
                    scopes: SCOPE_DESCRIPTIONS,
                },
            },
        };
    }
}
