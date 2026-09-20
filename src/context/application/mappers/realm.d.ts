declare namespace Commands {
    namespace Mappers {
        namespace Realm {
            interface Contract extends PublicContract {}

            interface PublicContract {
                bootstrapConfirmed: BootstrapConfirmed.Signature;
                bootstrapRejected: BootstrapRejected.Signature;
                transferConfirmed: TransferConfirmed.Signature;
                transferRejected: TransferRejected.Signature;
                transferAssignmentPurge: TransferAssignmentPurge.Signature;
                transferAssignmentCreate: TransferAssignmentCreate.Signature;
                transferAccessCache: TransferAccessCache.Signature;
                accessAssignmentPurge: AccessAssignmentPurge.Signature;
                accessOverridePurge: AccessOverridePurge.Signature;
                accessAssignmentUpdate: AccessAssignmentUpdate.Signature;
                accessOverrideUpdate: AccessOverrideUpdate.Signature;
                accessCache: AccessCache.Signature;
                projectionUpdatePayload: ProjectionUpdatePayload.Signature;
                projectionCreatePayload: ProjectionCreatePayload.Signature;
                projectionPurgePayload: ProjectionPurgePayload.Signature;
                realmLifecyclePayload: RealmLifecyclePayload.Signature;
                accessCachePayload: AccessCachePayload.Signature;
            }

            namespace ProjectionUpdatePayload {
                type Props = {
                    realms: Entities.Realm[];
                };

                type Result = Scripts.Realm.Update.Props[];

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionCreatePayload {
                type Props = Awaited<Services.Realm.Create.Result>;

                type Result = Scripts.Realm.Create.Props;

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionPurgePayload {
                type Props = {
                    realms: Entities.Realm[];
                };

                type Result = Scripts.Realm.Purge.Props[];

                type Signature = (props: Props) => Result;
            }

            namespace RealmLifecyclePayload {
                type Props = {
                    realms: Entities.Realm[];
                    actor: string;
                };

                type Result = Topics.Realm.LifecycleMessage["payload"][];

                type Signature = (props: Props) => Result;
            }

            namespace AccessCachePayload {
                type Props = {
                    realms: Entities.Realm[];
                };

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }

            type BootstrapRequest =
                | Topics.Realm.BootstrapOrganizationRequestedMessage["payload"]
                | Topics.Realm.BootstrapProjectRequestedMessage["payload"];

            type BootstrapResult = Awaited<Services.Realm.Create.Result> & { request: BootstrapRequest };

            type BootstrapFailure = { request: BootstrapRequest; reason: string };

            type TransferResult = Awaited<Services.Realm.TransferOwnership.Result> & {
                request: Topics.Realm.TransferOwnershipRequestedMessage["payload"];
            };

            type TransferFailure = { request: Topics.Realm.TransferOwnershipRequestedMessage["payload"]; reason: string };

            type AccessResult = Awaited<Services.Realm.PurgeAccountAccess.Result>;

            namespace BootstrapConfirmed {
                type Props = BootstrapResult;

                type Result = Topics.Realm.BootstrapConfirmedMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace BootstrapRejected {
                type Props = BootstrapFailure;

                type Result = Topics.Realm.BootstrapRejectedMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace TransferConfirmed {
                type Props = TransferResult;

                type Result = Topics.Realm.TransferOwnershipConfirmedMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace TransferRejected {
                type Props = TransferFailure;

                type Result = Topics.Realm.TransferOwnershipRejectedMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace TransferAssignmentPurge {
                type Props = TransferResult;

                type Result = Scripts.AccountRoleAssignment.Purge.Props[];

                type Signature = (props: Props) => Result;
            }

            namespace TransferAssignmentCreate {
                type Props = TransferResult;

                type Result = Scripts.AccountRoleAssignment.Create.Props;

                type Signature = (props: Props) => Result;
            }

            namespace TransferAccessCache {
                type Props = TransferResult;

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace AccessAssignmentPurge {
                type Props = AccessResult;

                type Result = Scripts.AccountRoleAssignment.Purge.Props[];

                type Signature = (props: Props) => Result;
            }

            namespace AccessOverridePurge {
                type Props = AccessResult;

                type Result = Scripts.PermissionOverride.Purge.Props[];

                type Signature = (props: Props) => Result;
            }

            namespace AccessAssignmentUpdate {
                type Props = AccessResult;

                type Result = Scripts.AccountRoleAssignment.Update.Props[];

                type Signature = (props: Props) => Result;
            }

            namespace AccessOverrideUpdate {
                type Props = AccessResult;

                type Result = Scripts.PermissionOverride.Update.Props[];

                type Signature = (props: Props) => Result;
            }

            namespace AccessCache {
                type Props = AccessResult;

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
