declare namespace Consumers {
    namespace Blacklist {
        interface Contract {
            handle: (props: Prosp) => Promise<void>;
        }

        type Prosp = { payload: string };

        type Handle = {
            sessionId: string;
            ttl: number;
        };
    }
}
