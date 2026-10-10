declare namespace Commands.RoleConflictGroup {
    interface Contract extends ControllerContract {}

    interface ControllerContract {
        restore: Restore.Signature;
        create: Create.Signature;
        update: Update.Signature;
        revoke: Revoke.Signature;
        purge: Purge.Signature;
    }

    namespace Restore {
        type Props = {
            actor: string;
            realm: string;
            input: {
                identifiers: string[];
                reason: string;
            };
            context: Extract.Meta;
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Create {
        type Props = {
            actor: string;
            realm: string;
            input: {
                members: string[];
                description: string;
                maxAllowed: number;
                code: string;
                name: string;
            };
            context: Extract.Meta;
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Update {
        type Props = {
            id: string;
            actor: string;
            realm: string;
            input: {
                patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                reason: string;
            };
            context: Extract.Meta;
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Revoke {
        type Props = {
            actor: string;
            realm: string;
            input: {
                identifiers: string[];
                reason: string;
            };
            context: Extract.Meta;
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Purge {
        type Props = {
            actor: string;
            realm: string;
            input: {
                identifiers: string[];
                reason: string;
            };
            context: Extract.Meta;
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }
}
