import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Services.PermissionOverride {
        interface Contract extends CommandContract {}

        interface CommandContract {
            restore: Restore.Signature;
            create: Create.Signature;
            revoke: Revoke.Signature;
            expire: Expire.Signature;
            purge: Purge.Signature;
            clean: Clean.Signature;
        }

        namespace Restore {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.PermissionOverride[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                realm: string;
                input: {
                    effect: PermissionOverrideEffect;
                    justification: string;
                    permission: string;
                    expiresAt?: Date;
                    account: string;
                };
            };

            type Result = Promise<Entities.PermissionOverride>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.PermissionOverride[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Expire {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.PermissionOverride[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.PermissionOverride[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Clean {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: string;
                    realm?: string;
                };
            };

            type Result = Promise<Entities.PermissionOverride[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
