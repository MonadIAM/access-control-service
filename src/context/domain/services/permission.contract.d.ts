declare namespace Services.Permission {
    interface Contract extends CommandContract {}

    interface CommandContract {
        restore: Restore.Signature;
        revoke: Revoke.Signature;
        create: Create.Signature;
        update: Update.Signature;
        purge: Purge.Signature;
    }

    namespace Restore {
        type Props = {
            transaction: ORM.EntityManager;
            identifiers: string[];
            realm: string;
        };

        type Result = Promise<Entities.Permission[]>;

        type Signature = (props: Props) => Result;
    }

    namespace Create {
        type Props = {
            transaction: ORM.EntityManager;
            realm: string;
            input: {
                code: string;
                name: string;
                description?: string;
            };
        };

        type Result = Promise<Entities.Permission>;

        type Signature = (props: Props) => Result;
    }

    namespace Update {
        type Props = {
            patch: Partial<Entities.Permission.MutableFields>;
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

        type Result = Promise<Entities.Permission[]>;

        type Signature = (props: Props) => Result;
    }

    namespace Purge {
        type Props = {
            transaction: ORM.EntityManager;
            identifiers: string[];
            realm: string;
        };

        type Result = Promise<Entities.Permission[]>;

        type Signature = (props: Props) => Result;
    }
}
