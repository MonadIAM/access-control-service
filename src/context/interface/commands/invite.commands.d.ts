import { InviteStatus } from "~context/enums";

declare global {
    namespace Commands {
        namespace Invite {
            interface Contract extends ControllerContract, InternalContract {}

            interface InternalContract {
                notificationCancelPayloadMapper: NotificationCancelPayloadMapper.Signature;
                notificationPayloadMapper: NotificationPayloadMapper.Signature;
                accessCachePayloadMapper: AccessCachePayloadMapper.Signature;
                membershipPayloadMapper: MembershipPayloadMapper.Signature;
                decline: Decline.Signature;
                accept: Accept.Signature;
                cancel: Cancel.Signature;
            }

            namespace NotificationCancelPayloadMapper {
                type Props = Entities.Invite[];

                type Result = Topics.Notification.CancelMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace NotificationPayloadMapper {
                type Props = Entities.Invite[];

                type Result = Topics.Notification.CreateMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace AccessCachePayloadMapper {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                };

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace MembershipPayloadMapper {
                type Props = {
                    invitedBy: string;
                    account: string;
                    realm: string;
                };

                type Result = Topics.Membership.GrantMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace Decline {
                type Props = {
                    actor: string;
                    realm: string;
                    input: { invite: string };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;

                type Signature = (props: Props) => Result;
            }

            namespace Accept {
                type Props = {
                    actor: string;
                    realm: string;
                    input: { invite: string };
                    context: Extract.Meta;
                };

                type ExecuteResult = {
                    assignments: Entities.AccountRoleAssignment[];
                    invitedBy: string;
                    account: string;
                    realm: string;
                };

                type Result = Promise<MessageResult>;

                type Signature = (props: Props) => Result;
            }

            namespace Cancel {
                type Props = {
                    actor: string;
                    realm: string;
                    input: { invite: string };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;

                type Signature = (props: Props) => Result;
            }

            interface ControllerContract {
                changeStatus: ChangeStatus.Signature;
                create: Create.Signature;
            }

            namespace ChangeStatus {
                type Props = {
                    actor: string;
                    realm: string;
                    input: {
                        invite: string;
                        status: Exclude<InviteStatus, InviteStatus.PENDING>;
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
                        invitee: string;
                        role: string;
                    };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
