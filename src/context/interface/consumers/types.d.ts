declare namespace Consumers {
    namespace DLQ {
        type Message = {
            originalTopic: string;
            retryCount: number;
            timestamp: string;
            payload: string;
            error: string;
        };
    }

    namespace Account {
        interface Contract {
            handle: (message: Payload) => Promise<void>;
        }

        type Event = "ACCOUNT_REGISTERED" | "ACCOUNT_PURGED";

        type Register = {
            accountId: string;
        };

        type Purge = {
            accountId: string;
        };

        type Payload = {
            payload: Register | Purge;
            eventType: Event;
        };

        type Handlers = {
            [K in Event]: (payload: Register | Purge) => Promise<void>;
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
                sessionId: string;
                ttl: number;
            };
        };
    }
}
