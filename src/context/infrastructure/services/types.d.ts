import { ProjectionScript } from "../scripts";

declare global {
    namespace InfrastructureServices {
        namespace BlacklistCache {
            interface Contract {
                exists: (props: Exists) => Promise<boolean>;
                set: (props: Set) => Promise<void>;
            }

            type Set = {
                sessionId: string;
                ttl: number;
            };

            type Exists = {
                sessionId: string;
            };
        }

        namespace ScriptLoader {
            interface Contract {
                reload: (script: ProjectionScript) => Promise<string>;
                getHash: (script: ProjectionScript) => string;
            }
        }

        namespace ScriptExecutor {
            interface Contract {
                execute: <T>(props: ProjectionScript, args: string[], keys?: string[]) => Promise<T>;
            }
        }

        namespace ProjectionCache {
            interface Contract {
                collectPermissions: (props: CollectPermissions) => Promise<Record<string, string>>;
                checkPermissions: (props: CheckPermissions) => Promise<boolean>;
                collectRealms: (props: CollectRealms) => Promise<string[]>;
                checkRealm: (props: CheckRealm) => Promise<boolean>;
            }

            type CollectPermissions = {
                account: string;
                realm: string;
            };

            type CheckRealm = {
                account: string;
                realm: string;
            };

            type CollectRealms = {
                account: string;
            };

            type CheckPermissions = {
                permissions: string[];
                account: string;
                realm: string;
            };
        }
    }
}
