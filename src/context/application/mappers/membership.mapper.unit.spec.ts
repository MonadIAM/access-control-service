import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/unit/entity-factory.registry";
import {
    PermissionOverrideEffect,
    NotificationContentKind,
    NotificationCategory,
    InvalidationScope,
    PlatformService,
    MessageTemplate,
} from "~context/enums";

import { MembershipMapper } from "./membership.mapper";

/* eslint-disable prettier/prettier */
const REALM_ID             = "00000000-0000-4000-8000-600000000001";
const ROLE_ID              = "00000000-0000-4000-8000-600000000002";
const SECOND_ROLE_ID       = "00000000-0000-4000-8000-600000000003";
const PERMISSION_REALM_ID  = "00000000-0000-4000-8000-600000000004";
const PERMISSION_ID        = "00000000-0000-4000-8000-600000000005";
const FIRST_ASSIGNMENT_ID  = "00000000-0000-4000-8000-600000000006";
const SECOND_ASSIGNMENT_ID = "00000000-0000-4000-8000-600000000007";
const ACCOUNT_ID           = "00000000-0000-4000-8000-600000000008";
const ACTOR_ID             = "00000000-0000-4000-8000-600000000009";
const INVITE_ID            = "00000000-0000-4000-8000-600000000010";
const PROCESS_ID           = "00000000-0000-4000-8000-600000000011";
const COMMAND_ID           = "00000000-0000-4000-8000-600000000012";
/* eslint-enable prettier/prettier */

const helpers = new EntityFactoryRegistry();
const mapper = new MembershipMapper();

function createAssignments(): Entities.AccountRoleAssignment[] {
    const realm = helpers.createRealm({ id: REALM_ID, name: "Primary Realm" });

    return [
        helpers.createAccountRoleAssignment({
            id: FIRST_ASSIGNMENT_ID,
            account: ACCOUNT_ID,
            realm,
            role: helpers.createRole({ id: ROLE_ID, realm }),
        }),
        helpers.createAccountRoleAssignment({
            id: SECOND_ASSIGNMENT_ID,
            account: ACCOUNT_ID,
            realm,
            role: helpers.createRole({ id: SECOND_ROLE_ID, realm }),
        }),
    ];
}

const joinRequest: Topics.Membership.JoinRequestedMessage["payload"]["input"] = {
    process: PROCESS_ID,
    command: COMMAND_ID,
    account: ACCOUNT_ID,
    invite: INVITE_ID,
    role: ROLE_ID,
};

const leaveRequest: Topics.Membership.LeaveRequestedMessage["payload"]["input"] = {
    process: PROCESS_ID,
    command: COMMAND_ID,
    account: ACCOUNT_ID,
    reason: "membership is no longer required",
};

afterEach(() => {
    jest.restoreAllMocks();
});

describe("MembershipMapper", () => {
    describe("joinAssignmentProjectionPayload", () => {
        it("maps all created assignments for the joined account", () => {
            expect(
                mapper.joinAssignmentProjectionPayload({
                    assignments: createAssignments(),
                    request: joinRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                }),
            ).toEqual({
                assignments: [
                    { assignment: FIRST_ASSIGNMENT_ID, role: ROLE_ID },
                    { assignment: SECOND_ASSIGNMENT_ID, role: SECOND_ROLE_ID },
                ],
                account: ACCOUNT_ID,
                realm: REALM_ID,
            });
        });
    });

    describe("joinAccessCachePayload", () => {
        it("maps the joined account-realm invalidation", () => {
            expect(
                mapper.joinAccessCachePayload({
                    assignments: createAssignments(),
                    request: joinRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                }),
            ).toEqual({
                items: [
                    {
                        scope: InvalidationScope.ACCOUNT_REALM,
                        account: ACCOUNT_ID,
                        realm: REALM_ID,
                    },
                ],
            });
        });
    });

    describe("joinConfirmedPayload", () => {
        it("maps the first assignment and current timestamp", () => {
            jest.spyOn(Date, "now").mockReturnValue(1_789_000_000_000);

            expect(
                mapper.joinConfirmedPayload({
                    assignments: createAssignments(),
                    request: joinRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                }),
            ).toEqual({
                actor: ACTOR_ID,
                realm: REALM_ID,
                input: {
                    assignment: FIRST_ASSIGNMENT_ID,
                    joinedAt: 1_789_000_000_000,
                    process: PROCESS_ID,
                    command: COMMAND_ID,
                    account: ACCOUNT_ID,
                    invite: INVITE_ID,
                    role: ROLE_ID,
                },
            });
        });
    });

    describe("joinRejectedPayload", () => {
        it("maps rejection context from the original request", () => {
            expect(
                mapper.joinRejectedPayload({
                    request: {
                        actor: ACTOR_ID,
                        realm: REALM_ID,
                        input: joinRequest,
                    },
                    reason: "role is unavailable",
                }),
            ).toEqual({
                actor: ACTOR_ID,
                realm: REALM_ID,
                input: {
                    process: PROCESS_ID,
                    command: COMMAND_ID,
                    invite: INVITE_ID,
                    reason: "role is unavailable",
                },
            });
        });
    });

    describe("leaveAssignmentProjectionPayload", () => {
        it("maps assignment relation keys for cleanup", () => {
            const assignments = createAssignments();
            const realmEntity = assignments[0].realm;

            expect(
                mapper.leaveAssignmentProjectionPayload({
                    overrides: [],
                    request: leaveRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    realmEntity,
                    assignments,
                }),
            ).toEqual({
                realm: REALM_ID,
                items: [
                    { account: ACCOUNT_ID, realm: REALM_ID, role: ROLE_ID },
                    {
                        role: SECOND_ROLE_ID,
                        account: ACCOUNT_ID,
                        realm: REALM_ID,
                    },
                ],
            });
        });
    });

    describe("leaveOverrideProjectionPayload", () => {
        it("maps override relation keys for cleanup", () => {
            const [assignment] = createAssignments();
            const realmEntity = assignment.realm;
            const permissionRealm = helpers.createRealm({
                id: PERMISSION_REALM_ID,
            });
            const permission = helpers.createPermission({
                id: PERMISSION_ID,
                realm: permissionRealm,
            });
            const override = helpers.createPermissionOverride({
                effect: PermissionOverrideEffect.ALLOW,
                account: ACCOUNT_ID,
                realm: realmEntity,
                permission,
            });

            expect(
                mapper.leaveOverrideProjectionPayload({
                    assignments: [assignment],
                    overrides: [override],
                    request: leaveRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    realmEntity,
                }),
            ).toEqual({
                realm: REALM_ID,
                items: [
                    {
                        permissionRealm: PERMISSION_REALM_ID,
                        permission: PERMISSION_ID,
                        account: ACCOUNT_ID,
                        realm: REALM_ID,
                    },
                ],
            });
        });
    });

    describe("leaveAccessCachePayload", () => {
        it("maps the leaving account-realm invalidation", () => {
            const [assignment] = createAssignments();

            expect(
                mapper.leaveAccessCachePayload({
                    assignments: [assignment],
                    overrides: [],
                    realmEntity: assignment.realm,
                    request: leaveRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                }),
            ).toEqual({
                items: [
                    {
                        scope: InvalidationScope.ACCOUNT_REALM,
                        account: ACCOUNT_ID,
                        realm: REALM_ID,
                    },
                ],
            });
        });
    });

    describe("leaveConfirmedPayload", () => {
        it("maps leave confirmation with the current timestamp", () => {
            jest.spyOn(Date, "now").mockReturnValue(1_789_000_000_001);
            const [assignment] = createAssignments();

            expect(
                mapper.leaveConfirmedPayload({
                    assignments: [assignment],
                    overrides: [],
                    realmEntity: assignment.realm,
                    request: leaveRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                }),
            ).toEqual({
                actor: ACTOR_ID,
                realm: REALM_ID,
                input: {
                    process: PROCESS_ID,
                    command: COMMAND_ID,
                    account: ACCOUNT_ID,
                    leftAt: 1_789_000_000_001,
                },
            });
        });
    });

    describe("leaveRejectedPayload", () => {
        it("maps rejection context from the original request", () => {
            expect(
                mapper.leaveRejectedPayload({
                    request: {
                        actor: ACTOR_ID,
                        realm: REALM_ID,
                        input: leaveRequest,
                    },
                    reason: "membership is protected",
                }),
            ).toEqual({
                actor: ACTOR_ID,
                realm: REALM_ID,
                input: {
                    process: PROCESS_ID,
                    command: COMMAND_ID,
                    account: ACCOUNT_ID,
                    reason: "membership is protected",
                },
            });
        });
    });

    describe("notificationPayload", () => {
        it("maps the realm exclusion notification", () => {
            const [assignment] = createAssignments();

            expect(
                mapper.notificationPayload({
                    assignments: [assignment],
                    overrides: [],
                    realmEntity: assignment.realm,
                    request: leaveRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                }),
            ).toEqual({
                actor: ACTOR_ID,
                realm: REALM_ID,
                input: {
                    sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
                    template: MessageTemplate.REALM_EXCLUDED,
                    kind: NotificationContentKind.TEMPLATE,
                    category: NotificationCategory.SYSTEM,
                    params: { realm: "Primary Realm" },
                    recipient: ACCOUNT_ID,
                    language: "en",
                },
            });
        });
    });
});
