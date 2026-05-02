declare namespace Consumers {
    type Props = { payload: string };

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
            handle: (message: Consumers.Props) => Promise<void>;
        }

        type Register = {
            eventType: "ACCOUNT_REGISTERED";
            accountId: string;
        };

        type Purge = {
            eventType: "ACCOUNT_PURGED";
            accountId: string;
        };

        type Handlers<T extends Register | Purge = Register | Purge> = {
            [K in T["eventType"]]: (payload: Extract<T, { eventType: K }>) => Promise<void>;
        };
    }

    namespace Blacklist {
        interface Contract {
            handle: (props: Consumers.Props) => Promise<void>;
        }

        type Handle = {
            sessionId: string;
            ttl: number;
        };
    }
}
