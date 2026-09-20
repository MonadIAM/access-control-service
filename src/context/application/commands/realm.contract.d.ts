declare namespace Commands {
    namespace Realm {
        interface Contract extends ControllerContract, ConsumerContract {}

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
                input: {
                    code: string;
                    name: string;
                    description?: string;
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
                input: {
                    patch: Partial<Entities.Realm.MutableFields>;
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
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: Extract.Meta;
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        interface ConsumerContract {
            bootstrapOrganization: BootstrapOrganization.Signature;
            restoreAccountAccess: RestoreAccountAccess.Signature;
            revokeAccountAccess: RevokeAccountAccess.Signature;
            purgeAccountAccess: PurgeAccountAccess.Signature;
            transferOwnership: TransferOwnership.Signature;
            bootstrapProject: BootstrapProject.Signature;
            restoreBySystem: RestoreBySystem.Signature;
            rejectBootstrap: RejectBootstrap.Signature;
            rejectTransfer: RejectTransfer.Signature;
            revokeBySystem: RevokeBySystem.Signature;
            purgeBySystem: PurgeBySystem.Signature;
        }

        namespace BootstrapOrganization {
            type Props = Topics.Realm.BootstrapOrganizationRequestedMessage["payload"] & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace BootstrapProject {
            type Props = Topics.Realm.BootstrapProjectRequestedMessage["payload"] & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace TransferOwnership {
            type Props = Topics.Realm.TransferOwnershipRequestedMessage["payload"] & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace RejectBootstrap {
            type Props = Commands.Mappers.Realm.BootstrapFailure & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace RejectTransfer {
            type Props = Commands.Mappers.Realm.TransferFailure & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace RevokeBySystem {
            type Props = Topics.Realm.SystemLifecycleMessage["payload"] & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace RestoreBySystem {
            type Props = Topics.Realm.SystemLifecycleMessage["payload"] & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace PurgeBySystem {
            type Props = Topics.Realm.SystemLifecycleMessage["payload"] & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace PurgeAccountAccess {
            type Props = Topics.Realm.AccountAccessMessage["payload"] & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace RevokeAccountAccess {
            type Props = Topics.Realm.AccountAccessMessage["payload"] & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace RestoreAccountAccess {
            type Props = Topics.Realm.AccountAccessMessage["payload"] & {
                incoming: TransactionManager.Service.IncomingMessage;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }
    }
}
