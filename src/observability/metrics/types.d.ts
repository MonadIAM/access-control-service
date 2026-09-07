import type { FastifyRequest } from "fastify";
import type { Counter } from "prom-client";

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

            namespace Kafka {
                type CounterMetric = Counter<string>;

                interface Contract extends PublicContract, InternalContract {}

                interface PublicContract {
                    recordRetry: RecordRetry.Signature;
                    recordDead: RecordDead.Signature;
                }

                interface InternalContract {
                    resolveErrorType: ResolveErrorType.Signature;
                }

                namespace RecordRetry {
                    type Props = {
                        topic: string;
                        error: unknown;
                    };

                    type Result = void;

                    type Signature = (props: Props) => Result;
                }

                namespace RecordDead {
                    type Props = {
                        topic: string;
                        error: unknown;
                    };

                    type Result = void;

                    type Signature = (props: Props) => Result;
                }

                namespace ResolveErrorType {
                    type Props = {
                        error: unknown;
                    };

                    type Result = string;

                    type Signature = (props: Props) => Result;
                }
            }
        }
    }
}
