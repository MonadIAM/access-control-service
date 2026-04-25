declare namespace Consumers {
    namespace Blacklist {
        interface Contract {
            handle: (props: Handle) => Promise<void>;
        }

        type Handle = {
            sessionId: string;
            ttl: number;
        };
    }
}
