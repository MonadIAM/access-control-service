import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";

import { name, version } from "../../package.json";

const SWAGGER_TAGS: Record<string, string> = {
    Realm: "Defines multi-tenant boundaries and isolation scopes for resource access.",
    Role: "Lifecycle management for roles, including complex inheritance and hierarchical structures.",
    Permission: "System-wide registry of granular capabilities used for both RBAC and DAC logic.",
    RolePermissionMatrix: "Defines the foundational RBAC mapping between abstract roles and concrete permissions.",
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
