import { PrivilegeScope } from "@monadiam/shared";

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
                    permissions: string[];
                    globalOnly?: boolean;
                    account: string;
                    realm: string;
                };

                type Result = Promise<string[]>;

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
                evalsha: Evalsha.Signature;
            }

            namespace Evalsha {
                type Props = {
                    script: ProjectionScript;
                    args: string[];
                    keys: string[];
                };

                type Result<T> = Promise<T>;

                type Signature = <T>(props: Props) => Result<T>;
            }

            interface PublicContract {
                execute: Execute.Signature;
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
            interface Contract extends PublicContract {}

            interface PublicContract {
                getHash: GetHash.Signature;
                reload: Reload.Signature;
            }

            namespace GetHash {
                type Props = ProjectionScript;

                type Result = string;

                type Signature = (props: Props) => Result;
            }

            namespace Reload {
                type Props = ProjectionScript;

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
