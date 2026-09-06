import type { FastifyRequest } from "fastify";

import {
    HTTP_REQUEST_METRICS_IN_FLIGHT_LABELS,
    HTTP_REQUEST_METRICS_STARTED_AT,
    HTTP_REQUEST_METRICS_RECORDED,
} from "./tokens";

declare global {
    namespace Observability {
        namespace Metrics {
            namespace Http {
                type InFlightLabels = {
                    method: string;
                    route: string;
                };

                type Request = FastifyRequest & {
                    [HTTP_REQUEST_METRICS_IN_FLIGHT_LABELS]?: InFlightLabels;
                    [HTTP_REQUEST_METRICS_STARTED_AT]?: number;
                    [HTTP_REQUEST_METRICS_RECORDED]?: boolean;
                };
            }
        }
    }
}
