import { PermissionCode, PrivilegeScope } from "@monadiam/shared";

import { ProjectionScript } from "../scripts";

declare global {
    namespace InfrastructureServices {
        namespace ReauthenticationCache {
            interface Contract extends PublicContract {}

            interface PublicContract {
                exists: Exists.Signature;
                delete: Delete.Signature;
                set: Set.Signature;
            }

            namespace Exists {
                type Props = {
                    session: string;
                };

                type Result = Promise<boolean>;

                type Signature = (props: Props) => Result;
            }

            namespace Delete {
                type Props = {
                    session: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Set {
                type Props = {
                    session: string;
                    ttl: number;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace ProjectionCache {
            interface Contract extends PublicContract {}

            interface PublicContract {
                validateAssignments: ValidateAssignments.Signature;
                collectPermissions: CollectPermissions.Signature;
                checkPermissions: CheckPermissions.Signature;
                collectRealms: CollectRealms.Signature;
                checkRealm: CheckRealm.Signature;
            }

            namespace ValidateAssignments {
                type Props = {
                    items: {
                        account: string;
                        realm: string;
                        role: string;
                    }[];
                };

                type Result = Promise<{
                    missing: string[];
                    groups: {
                        remaining: number;
                        account: string;
                        realm: string;
                    }[];
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace CollectPermissions {
                type Props = {
                    account: string;
                    realm: string;
                };

                type Result = Promise<Record<string, PrivilegeScope>>;

                type Signature = (props: Props) => Result;
            }

            namespace CheckPermissions {
                type Props = {
                    permissions: PermissionCode[];
                    globalOnly?: boolean;
                    account: string;
                    realm: string;
                };

                type Result = Promise<Partial<Record<PermissionCode, PrivilegeScope>>>;

                type Signature = (props: Props) => Result;
            }

            namespace CollectRealms {
                type Props = {
                    account: string;
                };

                type Result = Promise<string[]>;

                type Signature = (props: Props) => Result;
            }

            namespace CheckRealm {
                type Props = {
                    account: string;
                    realm: string;
                };

                type Result = Promise<boolean>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace BlacklistCache {
            interface Contract extends PublicContract {}

            interface PublicContract {
                exists: Exists.Signature;
                set: Set.Signature;
            }

            namespace Exists {
                type Props = {
                    session: string;
                };

                type Result = Promise<boolean>;

                type Signature = (props: Props) => Result;
            }

            namespace Set {
                type Props = {
                    session: string;
                    ttl: number;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace ScriptExecutor {
            interface Contract extends InternalContract, PublicContract {}

            interface InternalContract {
                executeScript: ExecuteScript.Signature;
                evalsha: Evalsha.Signature;
            }

            namespace ExecuteScript {
                type Props = Evalsha.Props;

                type Result<T> = Promise<T>;

                type Signature = <T>(props: Props) => Result<T>;
            }

            namespace Evalsha {
                type Props = {
                    script: ProjectionScript;
                    args: string[];
                    keys: string[];
                    mode: ScriptLoader.Mode;
                };

                type Result<T> = Promise<T>;

                type Signature = <T>(props: Props) => Result<T>;
            }

            interface PublicContract {
                consume: Consume.Signature;
                execute: Execute.Signature;
            }

            namespace Consume {
                type Props = {
                    script: ProjectionScript;
                    args: string[];
                    keys?: string[];
                    event: string;
                };

                type Outcome<T> =
                    | {
                          status: "processed";
                          value: T;
                      }
                    | {
                          status: "duplicate";
                      };

                type ScriptResult<T> = [processed: 0] | [processed: 1, value: T];

                type Result<T> = Promise<Outcome<T>>;

                type Signature = <T>(props: Props) => Result<T>;
            }

            namespace Execute {
                type Props = {
                    script: ProjectionScript;
                    args: string[];
                    keys?: string[];
                };

                type Result<T> = Promise<T>;

                type Signature = <T>(props: Props) => Result<T>;
            }
        }

        namespace ScriptLoader {
            type Mode = "consume" | "execute";

            interface Contract extends PublicContract {}

            interface PublicContract {
                getHash: GetHash.Signature;
                reload: Reload.Signature;
            }

            namespace GetHash {
                type Props = {
                    script: ProjectionScript;
                    mode: Mode;
                };

                type Result = string;

                type Signature = (props: Props) => Result;
            }

            namespace Reload {
                type Props = {
                    script: ProjectionScript;
                    mode: Mode;
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
