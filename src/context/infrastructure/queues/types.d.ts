declare namespace Processors {
    namespace PermissionInvalidation {
        type Props = {
            accounts: string[];
            offset?: number;
        };
        type Result = {
            invalidated: number;
        };
    }
}

declare namespace Queues {
    namespace PermissionInvalidation {
        interface Contract {
            add: (props: Add) => Promise<void>;
        }

        type Add = {
            accounts: string[];
        };
    }
}
