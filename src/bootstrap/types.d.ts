import type { OAuthFlowObject, SecuritySchemeObject } from "@nestjs/swagger";
import type { Counter, Histogram } from "prom-client";

declare global {
    namespace Bootstrap {
        namespace Metrics {
            namespace RecordHttpRequestMetric {
                type Props = {
                    counter: Counter<string>;
                    duration: number;
                    histogram: Histogram<string>;
                    request: Observability.Metrics.Http.Request;
                    statusCode: number;
                };

                type Result = void;
            }

            namespace ResolveDuration {
                type Props = {
                    request: Observability.Metrics.Http.Request;
                };

                type Result = number;
            }

            namespace ShouldSkipRequest {
                type Props = {
                    request: Observability.Metrics.Http.Request;
                };

                type Result = boolean;
            }
        }

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
