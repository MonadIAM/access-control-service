import { OAuthFlowObject, SecuritySchemeObject } from "@nestjs/swagger";

declare global {
    namespace Bootstrap {
        namespace Reference {
            type PkceMode = "SHA-256" | "plain" | "no";

            type Source = {
                content?: object;
                url?: string;
                title: string;
                slug: string;
                default?: boolean;
            };

            type OAuthFlow = OAuthFlowObject & {
                "x-scalar-client-id": string;
                "x-usePkce": PkceMode;
            };

            type SecurityScheme = SecuritySchemeObject & {
                "x-default-scopes": string[];
                flows: { authorizationCode: OAuthFlow };
            };
        }
    }
}
