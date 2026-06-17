import { ProjectionScript } from "../scripts";

declare global {
    namespace InfrastructureServices {
        namespace ReauthenticationCache {
            interface Contract {
                set(props: Set): Promise<void>;
                exists(props: Exists): Promise<boolean>;
                delete(props: Delete): Promise<void>;
            }

            type Set = {
                session: string;
                ttl: number;
            };

            type Exists = {
                session: string;
            };

            type Delete = {
                session: string;
            };
        }
        namespace BlacklistCache {
            interface Contract {
                exists(props: Exists): Promise<boolean>;
                set(props: Set): Promise<void>;
            }

            type Set = {
                session: string;
                ttl: number;
            };

            type Exists = {
                session: string;
            };
        }

        namespace ScriptLoader {
            interface Contract {
                reload(script: ProjectionScript): Promise<string>;
                getHash(script: ProjectionScript): string;
            }
        }

        namespace ScriptExecutor {
            interface Contract {
                execute<T>(props: ProjectionScript, args: string[], keys?: string[]): Promise<T>;
            }
        }

        namespace ProjectionCache {
            interface Contract {
                validateAssignments(props: ValidateAssignments): Promise<ValidateAssignmentsResult>;
                collectPermissions(props: CollectPermissions): Promise<Record<string, string>>;
                checkPermissions(props: CheckPermissions): Promise<string[]>;
                collectRealms(props: CollectRealms): Promise<string[]>;
                checkRealm(props: CheckRealm): Promise<boolean>;
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

            type ValidateAssignments = {
                items: {
                    account: string;
                    realm: string;
                    role: string;
                }[];
            };

            type ValidateAssignmentsResult = {
                missing: string[];
                groups: {
                    remaining: number;
                    account: string;
                    realm: string;
                }[];
            };
        }
    }
}
