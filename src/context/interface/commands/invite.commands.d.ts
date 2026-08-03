import { InviteStatus } from "~context/enums";

declare global {
    namespace Commands {
        namespace Invite {
            interface ControllerContract {
                changeStatus(props: ChangeStatus.Props): ChangeStatus.Result;
                create(props: Create.Props): Create.Result;
            }

            interface InternalContract {
                notificationPayloadMapper(props: NotificationPayloadMapper.Props): NotificationPayloadMapper.Result;
                accessCachePayloadMapper(props: AccessCachePayloadMapper.Props): AccessCachePayloadMapper.Result;
                membershipPayloadMapper(props: MembershipPayloadMapper.Props): MembershipPayloadMapper.Result;
                decline(props: Decline.Props): Decline.Result;
                accept(props: Accept.Props): Accept.Result;
                cancel(props: Cancel.Props): Cancel.Result;
                notificationCancelPayloadMapper(
                    props: NotificationCancelPayloadMapper.Props,
                ): NotificationCancelPayloadMapper.Result;
            }

            interface Contract extends ControllerContract, InternalContract {}

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
            }

            namespace Cancel {
                type Props = {
                    actor: string;
                    realm: string;
                    input: { invite: string };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;
            }

            namespace Decline {
                type Props = {
                    actor: string;
                    realm: string;
                    input: { invite: string };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;
            }

            namespace NotificationPayloadMapper {
                type Props = Entities.Invite[];
                type Result = Topics.Notification.CreateMessage["payload"];
            }

            namespace NotificationCancelPayloadMapper {
                type Props = Entities.Invite[];
                type Result = Topics.Notification.CancelMessage["payload"];
            }

            namespace AccessCachePayloadMapper {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                };

                type Result = Topics.AccessCache.Message["payload"];
            }

            namespace MembershipPayloadMapper {
                type Props = {
                    invitedBy: string;
                    account: string;
                    realm: string;
                };

                type Result = Topics.Membership.GrantMessage["payload"];
            }
        }
    }
}
