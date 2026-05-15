declare namespace Commands {
    namespace Realm {
        interface ControllerContract {
            restore: (props: Restore.Props) => Promise<Restore.Result>;
            create: (props: Create.Props) => Promise<Create.Result>;
            update: (props: Update.Props) => Promise<Update.Result>;
            revoke: (props: Revoke.Props) => Promise<Revoke.Result>;
            purge: (props: Purge.Props) => Promise<Purge.Result>;
        }

        interface PrivateContract {
            outboxPayloadMapper: (props: OutboxPayloadMapper.Props) => OutboxPayloadMapper.Result;
        }

        interface Contract extends ControllerContract, PrivateContract {}

        namespace Create {
            type Props = {
                actor: string;
                input: {
                    code: string;
                    name: string;
                    description?: string;
                };
                context: Extract.Meta;
            };

            type Result = MessageResult;
        }

        namespace Update {
            type Props = {
                id: string;
                actor: string;
                input: {
                    patch: Partial<Entities.Realm.MutableFields>;
                    reason: string;
                };
                context: Extract.Meta;
            };

            type Result = MessageResult;
        }

        namespace Purge {
            type Props = {
                actor: string;
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: Extract.Meta;
            };

            type Result = MessageResult;
        }

        namespace Revoke {
            type Props = {
                actor: string;
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: Extract.Meta;
            };

            type Result = MessageResult;
        }

        namespace Restore {
            type Props = {
                actor: string;
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: Extract.Meta;
            };

            type Result = MessageResult;
        }

        namespace OutboxPayloadMapper {
            type Result = Events.AccessCache.Invalidation;
            type Props = Entities.Realm[];
        }
    }
}
