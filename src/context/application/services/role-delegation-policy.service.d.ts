declare namespace Services {
    namespace RoleDelegationPolicy {
        interface Contract extends CommandContract {}

        interface CommandContract {
            restore: Restore.Signature;
            create: Create.Signature;
            update: Update.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
        }

        namespace Restore {
            type Props = {
                entities: Entities.RoleDelegationPolicy[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
                input: {
                    delegator: Entities.Role;
                    target: Entities.Role;
                    justification: string;
                    depthLimit?: number;
                    expiresAt?: Date;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                patch: Partial<Entities.RoleDelegationPolicy.MutableFields>;
                entity: Entities.RoleDelegationPolicy;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.RoleDelegationPolicy[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.RoleDelegationPolicy[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
