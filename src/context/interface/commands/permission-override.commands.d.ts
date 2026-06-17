import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Commands {
        namespace PermissionOverride {
            interface ControllerContract {
                restore(props: Restore.Props): Restore.Result;
                create(props: Create.Props): Create.Result;
                revoke(props: Revoke.Props): Revoke.Result;
                purge(props: Purge.Props): Purge.Result;
            }

            interface ConsumerContract {
                clean(props: Clean.Props): Clean.Result;
            }

            interface PrivateContract {
                outboxPayloadMapper(props: OutboxPayloadMapper.Props): OutboxPayloadMapper.Result;
            }

            interface Contract extends ControllerContract, ConsumerContract, PrivateContract {}

            namespace Create {
                type Props = {
                    actor: string;
                    realm: string;
                    input: {
                        effect: PermissionOverrideEffect;
                        permission: string;
                        account: string;
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

            namespace Clean {
                type Props = {
                    account: string;
                };

                type Result = Promise<void>;
            }

            namespace OutboxPayloadMapper {
                type Result = Topics.AccessCache.Message["payload"];
                type Props = Entities.PermissionOverride[];
            }
        }
    }
}
