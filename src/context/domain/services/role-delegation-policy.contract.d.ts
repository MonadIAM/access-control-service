declare namespace Services {
    namespace RoleDelegationPolicy {
        interface Contract extends CommandContract {}

        interface CommandContract {
            restore: Restore.Signature;
            create: Create.Signature;
            update: Update.Signature;
            revoke: Revoke.Signature;
            expire: Expire.Signature;
            purge: Purge.Signature;
        }

        namespace Restore {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.RoleDelegationPolicy[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                realm: string;
                input: {
                    justification: string;
                    depthLimit?: number;
                    delegator: string;
                    expiresAt?: Date;
                    target: string;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                patch: Partial<Entities.RoleDelegationPolicy.MutableFields>;
                transaction: ORM.EntityManager;
                realm: string;
                id: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.RoleDelegationPolicy[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Expire {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.RoleDelegationPolicy[];
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

            type Result = Promise<Entities.RoleDelegationPolicy[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
