declare namespace Services {
    namespace AccountRoleAssignment {
        interface Contract extends CommandContract {}

        interface CommandContract {
            restore: Restore.Signature;
            create: Create.Signature;
            assign: Assign.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
            clean: Clean.Signature;
        }

        namespace Restore {
            type Props = {
                entities: Entities.AccountRoleAssignment[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
                actor: string;
                input: {
                    justification?: string;
                    roles: Entities.Role[];
                    expiresAt?: Date;
                    account: string;
                };
            };

            type Result = Promise<Entities.AccountRoleAssignment[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Assign {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    realm: Entities.Realm;
                    role: Entities.Role;
                    expiresAt?: Date;
                    account: string;
                };
            };

            type Result = Entities.AccountRoleAssignment;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.AccountRoleAssignment[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.AccountRoleAssignment[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Clean {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.AccountRoleAssignment[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
