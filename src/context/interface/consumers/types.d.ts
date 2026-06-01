import { ProjectionScript } from "~context/infrastructure/scripts";

declare global {
    namespace Consumers {
        namespace DLQ {
            type Message = {
                originalTopic: string;
                payload: unknown;
                error: string;
            };
        }

        namespace Account {
            interface Contract {
                handle: (message: Payload) => Promise<void>;
            }

            type Event = "ACCOUNT_REGISTERED" | "ACCOUNT_PURGED";

            type Register = {
                account: string;
            };

            type Purge = {
                account: string;
            };

            type Payload = {
                payload: Register | Purge;
                eventType: Event;
            };

            type Handlers = {
                [K in Event]: (payload: Register | Purge) => Promise<void>;
            };
        }

        namespace ElevatedAccess {
            interface Contract {
                handle: (props: Payload) => Promise<void>;
            }

            type Event = "ELEVATED_ACCESS_GRANTED";

            type Payload = {
                eventType: Event;
                payload: {
                    expiresAt: number;
                    session: string;
                };
            };
        }

        namespace Blacklist {
            interface Contract {
                handle: (props: Payload) => Promise<void>;
            }

            type Event = "SESSION_REVOKED";

            type Payload = {
                eventType: Event;
                payload: {
                    expiresAt: number;
                    session: string;
                };
            };
        }

        namespace Projection {
            interface Contract {
                handle: (props: Payload) => Promise<void>;
            }

            type Payload = {
                operationType: ProjectionScript;
                lastError: Nullable<string>;
                appliedAt: Nullable<Date>;
                lockedAt: Nullable<Date>;
                lockedBy: Nullable<Date>;
                availableAt: Date;
                attempts: number;
                createdAt: Date;
                payload: string;
                status: string;
                id: string;
            };
        }
    }
}
