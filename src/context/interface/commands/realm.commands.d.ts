declare namespace Commands {
    namespace Realm {
        interface ControllerContract {
            restore(props: Restore.Props): Restore.Result;
            exclude(props: Exclude.Props): Exclude.Result;
            create(props: Create.Props): Create.Result;
            update(props: Update.Props): Update.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        interface PrivateContract {
            outboxPayloadMapper(props: OutboxPayloadMapper.Props): OutboxPayloadMapper.Result;
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

            type Result = Promise<MessageResult>;
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

            type Result = Promise<MessageResult>;
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

            type Result = Promise<MessageResult>;
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

            type Result = Promise<MessageResult>;
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

            type Result = Promise<MessageResult>;
        }

        namespace Exclude {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    account: string;
                    reason: string;
                };
                context: Extract.Meta;
            };

            type ExecuteResult = {
                assignments: Entities.AccountRoleAssignment[];
                overrides: Entities.PermissionOverride[];
            };

            type Result = Promise<MessageResult>;
        }

        namespace OutboxPayloadMapper {
            type Result = Topics.AccessCache.Message["payload"];
            type Props = Entities.Realm[];
        }
    }
}
