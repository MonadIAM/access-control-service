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

        namespace PermissionCache {
            interface Contract {
                check: (props: Check) => Promise<boolean>;
            }

            type Check = {
                permissions: string[];
                account: string;
                realm: string;
            };
        }
    }
}
