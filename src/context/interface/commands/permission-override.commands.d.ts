import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Commands {
        namespace PermissionOverride {
            interface ControllerContract {
                restore: (props: Restore.Props) => Promise<Restore.Result>;
                create: (props: Create.Props) => Promise<Create.Result>;
                revoke: (props: Revoke.Props) => Promise<Revoke.Result>;
                purge: (props: Purge.Props) => Promise<Purge.Result>;
            }

            interface ConsumerContract {
                clean: (props: Clean.Props) => Promise<Clean.Result>;
            }

            interface Contract extends ControllerContract, ConsumerContract {}

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

                type Result = MessageResult;
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

                type Result = MessageResult;
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

                type Result = MessageResult;
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

                type Result = MessageResult;
            }

            namespace Clean {
                type Props = {
                    account: string;
                };

                type Result = void;
            }
        }
    }
}
