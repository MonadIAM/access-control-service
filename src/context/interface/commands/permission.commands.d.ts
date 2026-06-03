declare namespace Commands {
    namespace Permission {
        interface ControllerContract {
            restore: (props: Restore.Props) => Restore.Result;
            create: (props: Create.Props) => Create.Result;
            update: (props: Update.Props) => Update.Result;
            revoke: (props: Revoke.Props) => Revoke.Result;
            purge: (props: Purge.Props) => Purge.Result;
        }

        interface PrivateContract {
            outboxPayloadMapper: (props: OutboxPayloadMapper.Props) => OutboxPayloadMapper.Result;
        }

        interface Contract extends ControllerContract, PrivateContract {}

        namespace Create {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    code: string;
                    name: string;
                    description?: string;
                };
                context: Extract.Meta;
            };

            type Result = Promise<MessageResult>;
        }

        namespace Update {
            type Props = {
                id: string;
                actor: string;
                realm: string;
                input: {
                    patch: Partial<Entities.Permission.MutableFields>;
                    reason: string;
                };
                context: Extract.Meta;
            };

            type Result = Promise<MessageResult>;
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
        }

        namespace OutboxPayloadMapper {
            type Result = Topics.AccessCache.Message["payload"];
            type Props = Entities.Permission[];
        }
    }
}
