declare namespace Services.AccountRoleAssignment {
    interface Contract extends CommandContract {}

    interface CommandContract {
        restore: Restore.Signature;
        create: Create.Signature;
        ensure: Ensure.Signature;
        assign: Assign.Signature;
        revoke: Revoke.Signature;
        expire: Expire.Signature;
        purge: Purge.Signature;
        clean: Clean.Signature;
    }

    namespace Create {
        type Props = {
            transaction: ORM.EntityManager;
            realm: string;
            actor: string;
            input: {
                justification?: string;
                expiresAt?: Date;
                account: string;
                roles: string[];
            };
        };

        type Result = Promise<Entities.AccountRoleAssignment[]>;

        type Signature = (props: Props) => Result;
    }

    namespace Ensure {
        type Props = {
            transaction: ORM.EntityManager;
            realm: string;
            actor: string;
            input: {
                account: string;
                role?: string;
            };
        };

        type Result = Promise<Entities.AccountRoleAssignment[]>;

        type Signature = (props: Props) => Result;
    }

    namespace Assign {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                expiresAt?: Date;
                account: string;
                realm: string;
                role: string;
            };
        };

        type Result = Promise<Entities.AccountRoleAssignment>;

        type Signature = (props: Props) => Result;
    }

    namespace Revoke {
        type Props = {
            transaction: ORM.EntityManager;
            identifiers: string[];
            realm: string;
        };

        type Result = Promise<Entities.AccountRoleAssignment[]>;

        type Signature = (props: Props) => Result;
    }

    namespace Restore {
        type Props = {
            transaction: ORM.EntityManager;
            identifiers: string[];
            realm: string;
        };

        type Result = Promise<Entities.AccountRoleAssignment[]>;

        type Signature = (props: Props) => Result;
    }

    namespace Expire {
        type Props = {
            transaction: ORM.EntityManager;
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
            input: {
                account: string;
                realm?: string;
            };
        };

        type Result = Promise<Entities.AccountRoleAssignment[]>;

        type Signature = (props: Props) => Result;
    }
}
