import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Commands {
        namespace PermissionOverride {
            interface Contract extends ControllerContract, ConsumerContract, InternalContract {}

            interface InternalContract {
                accessCachePayloadMapper: AccessCachePayloadMapper.Signature;
            }

            namespace AccessCachePayloadMapper {
                type Result = Topics.AccessCache.Message["payload"];

                type Props = Entities.PermissionOverride[];

                type Signature = (props: Props) => Result;
            }

            interface ConsumerContract {
                clean: Clean.Signature;
            }

            namespace Clean {
                type Props = {
                    account: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            interface ControllerContract {
                restore: Restore.Signature;
                create: Create.Signature;
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
                        effect: PermissionOverrideEffect;
                        permission: string;
                        account: string;
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
    }
}
