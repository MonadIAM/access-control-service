import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Commands {
        namespace PermissionOverride {
            interface Contract extends ControllerContract, ProcessorContract {}

            interface ProcessorContract {
                expire: Expire.Signature;
            }

            namespace Expire {
                type Props = {
                    batchSize: number;
                    now?: Date;
                };

                type Result = Promise<number>;

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
                        justification: string;
                        expiresAt?: Date;
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
