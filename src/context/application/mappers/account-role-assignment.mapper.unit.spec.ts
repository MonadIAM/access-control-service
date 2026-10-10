import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
import {
    PermissionOverrideEffect,
    NotificationContentKind,
    NotificationCategory,
    InvalidationScope,
    PlatformService,
    MessageTemplate,
} from "~context/enums";

import { AccountRoleAssignmentMapper } from "./account-role-assignment.mapper";

/* eslint-disable prettier/prettier */
const REALM_ID             = "00000000-0000-4000-8000-400000000001";
const SECOND_REALM_ID      = "00000000-0000-4000-8000-400000000002";
const FIRST_ROLE_ID        = "00000000-0000-4000-8000-400000000003";
const SECOND_ROLE_ID       = "00000000-0000-4000-8000-400000000004";
const THIRD_ROLE_ID        = "00000000-0000-4000-8000-400000000005";
const FIRST_ASSIGNMENT_ID  = "00000000-0000-4000-8000-400000000006";
const SECOND_ASSIGNMENT_ID = "00000000-0000-4000-8000-400000000007";
const THIRD_ASSIGNMENT_ID  = "00000000-0000-4000-8000-400000000008";
const PERMISSION_ID        = "00000000-0000-4000-8000-400000000009";
const FIRST_ACCOUNT_ID     = "00000000-0000-4000-8000-400000000010";
const SECOND_ACCOUNT_ID    = "00000000-0000-4000-8000-400000000011";
const ACTOR_ID             = "00000000-0000-4000-8000-400000000012";
/* eslint-enable prettier/prettier */

const mapper = new AccountRoleAssignmentMapper();
const helpers = new EntityFactoryRegistry();

function createAssignments(): Entities.AccountRoleAssignment[] {
    const realm = helpers.createRealm({ id: REALM_ID, name: "Primary Realm" });
    const firstRole = helpers.createRole({
        id: FIRST_ROLE_ID,
        name: "Administrator",
        realm,
    });
    const secondRole = helpers.createRole({
        id: SECOND_ROLE_ID,
        name: "Auditor",
        realm,
    });

    return [
        helpers.createAccountRoleAssignment({
            id: FIRST_ASSIGNMENT_ID,
            account: FIRST_ACCOUNT_ID,
            role: firstRole,
            realm,
        }),
        helpers.createAccountRoleAssignment({
            id: SECOND_ASSIGNMENT_ID,
            account: FIRST_ACCOUNT_ID,
            role: secondRole,
            realm,
        }),
    ];
}

describe("[DataMapper] - AccountRoleAssignment", () => {
    describe("[Method] - groupByRealm", () => {
        it("[case] - groups assignments by owning realm and preserves their order", () => {
            // Arrange
            const [first, second] = createAssignments();
            const secondRealm = helpers.createRealm({ id: SECOND_REALM_ID });
            const third = helpers.createAccountRoleAssignment({
                id: THIRD_ASSIGNMENT_ID,
                account: SECOND_ACCOUNT_ID,
                role: helpers.createRole({
                    id: THIRD_ROLE_ID,
                    realm: secondRealm,
                }),
                realm: secondRealm,
            });

            // Act
            const result = mapper.groupByRealm({
                assignments: [first, third, second],
            });
            const result2 = result.get(REALM_ID);
            const result3 = result.get(SECOND_REALM_ID);

            // Assert
            expect([...result.keys()]).toEqual([REALM_ID, SECOND_REALM_ID]);
            expect(result2).toEqual([first, second]);
            expect(result3).toEqual([third]);
        });
    });

    describe("[Method] - projectionCreatePayload", () => {
        it("[case] - maps all assignments for one account and realm", () => {
            // Arrange

            // Act
            const result = mapper.projectionCreatePayload({
                assignments: createAssignments(),
            });

            // Assert
            expect(result).toEqual({
                assignments: [
                    { assignment: FIRST_ASSIGNMENT_ID, role: FIRST_ROLE_ID },
                    { assignment: SECOND_ASSIGNMENT_ID, role: SECOND_ROLE_ID },
                ],
                account: FIRST_ACCOUNT_ID,
                realm: REALM_ID,
            });
        });
    });

    describe("[Method] - projectionAssignPayload", () => {
        it("[case] - maps the direct assignment entity", () => {
            // Arrange
            const [assignment] = createAssignments();

            // Act
            const result = mapper.projectionAssignPayload({ assignments: [assignment] });

            // Assert
            expect(result).toEqual({
                assignments: [{ assignment: FIRST_ASSIGNMENT_ID, role: FIRST_ROLE_ID }],
                account: FIRST_ACCOUNT_ID,
                realm: REALM_ID,
            });
        });
    });

    describe("[Method] - projectionUpdatePayload", () => {
        it("[case] - splits updates by realm and uses each group revocation state", () => {
            // Arrange
            const [first, second] = createAssignments();
            first.isRevoked = true;
            second.isRevoked = true;
            const secondRealm = helpers.createRealm({ id: SECOND_REALM_ID });
            const third = helpers.createAccountRoleAssignment({
                id: THIRD_ASSIGNMENT_ID,
                account: SECOND_ACCOUNT_ID,
                realm: secondRealm,
                role: helpers.createRole({
                    realm: secondRealm,
                    id: THIRD_ROLE_ID,
                }),
                isRevoked: false,
            });

            // Act
            const result = mapper.projectionUpdatePayload({
                assignments: [first, third, second],
            });

            // Assert
            expect(result).toEqual([
                {
                    isRevoked: true,
                    realm: REALM_ID,
                    items: [
                        {
                            assignment: FIRST_ASSIGNMENT_ID,
                            account: FIRST_ACCOUNT_ID,
                            role: FIRST_ROLE_ID,
                            realm: REALM_ID,
                        },
                        {
                            assignment: SECOND_ASSIGNMENT_ID,
                            account: FIRST_ACCOUNT_ID,
                            role: SECOND_ROLE_ID,
                            realm: REALM_ID,
                        },
                    ],
                },
                {
                    isRevoked: false,
                    realm: SECOND_REALM_ID,
                    items: [
                        {
                            assignment: THIRD_ASSIGNMENT_ID,
                            account: SECOND_ACCOUNT_ID,
                            realm: SECOND_REALM_ID,
                            role: THIRD_ROLE_ID,
                        },
                    ],
                },
            ]);
        });
    });

    describe("[Method] - projectionPurgePayload", () => {
        it("[case] - splits relation cleanup by realm", () => {
            // Arrange
            const [first, second] = createAssignments();
            const secondRealm = helpers.createRealm({ id: SECOND_REALM_ID });
            const third = helpers.createAccountRoleAssignment({
                account: SECOND_ACCOUNT_ID,
                realm: secondRealm,
                role: helpers.createRole({
                    realm: secondRealm,
                    id: THIRD_ROLE_ID,
                }),
            });

            // Act
            const result = mapper.projectionPurgePayload({
                assignments: [first, third, second],
            });

            // Assert
            expect(result).toEqual([
                {
                    realm: REALM_ID,
                    items: [
                        {
                            account: FIRST_ACCOUNT_ID,
                            role: FIRST_ROLE_ID,
                            realm: REALM_ID,
                        },
                        {
                            account: FIRST_ACCOUNT_ID,
                            role: SECOND_ROLE_ID,
                            realm: REALM_ID,
                        },
                    ],
                },
                {
                    realm: SECOND_REALM_ID,
                    items: [
                        {
                            account: SECOND_ACCOUNT_ID,
                            realm: SECOND_REALM_ID,
                            role: THIRD_ROLE_ID,
                        },
                    ],
                },
            ]);
        });
    });

    describe("[Method] - notificationGrantPayload", () => {
        it("[case] - maps a grouped grant notification", () => {
            // Arrange

            // Act
            const result = mapper.notificationGrantPayload({
                actor: ACTOR_ID,
                assignments: createAssignments(),
            });

            // Assert
            expect(result).toEqual({
                actor: ACTOR_ID,
                realm: REALM_ID,
                input: {
                    params: {
                        role: "Administrator, Auditor",
                        realm: "Primary Realm",
                    },
                    sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
                    template: MessageTemplate.ASSIGNMENT_GRANTED,
                    kind: NotificationContentKind.TEMPLATE,
                    category: NotificationCategory.SYSTEM,
                    recipient: FIRST_ACCOUNT_ID,
                    language: "en",
                },
            });
        });
    });

    describe("[Method] - notificationRevokePayload", () => {
        it("[case] - groups revoke notifications by account", () => {
            // Arrange
            const [first, second] = createAssignments();
            const realm = first.realm;
            const third = helpers.createAccountRoleAssignment({
                account: SECOND_ACCOUNT_ID,
                realm,
                role: helpers.createRole({
                    id: THIRD_ROLE_ID,
                    name: "Viewer",
                    realm,
                }),
            });

            // Act
            const result = mapper.notificationRevokePayload({
                assignments: [first, third, second],
                actor: ACTOR_ID,
            });

            // Assert
            expect(result).toEqual([
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: {
                        params: {
                            role: "Administrator, Auditor",
                            realm: "Primary Realm",
                        },
                        sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
                        template: MessageTemplate.ASSIGNMENT_REVOKED,
                        kind: NotificationContentKind.TEMPLATE,
                        category: NotificationCategory.SYSTEM,
                        recipient: FIRST_ACCOUNT_ID,
                        language: "en",
                    },
                },
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: {
                        params: {
                            realm: "Primary Realm",
                            role: "Viewer",
                        },
                        sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
                        template: MessageTemplate.ASSIGNMENT_REVOKED,
                        kind: NotificationContentKind.TEMPLATE,
                        category: NotificationCategory.SYSTEM,
                        recipient: SECOND_ACCOUNT_ID,
                        language: "en",
                    },
                },
            ]);
        });
    });

    describe("[Method] - accessCachePayload", () => {
        it("[case] - maps account-realm invalidations", () => {
            // Arrange

            // Act
            const result = mapper.accessCachePayload({ assignments: createAssignments() });

            // Assert
            expect(result).toEqual({
                items: [
                    {
                        scope: InvalidationScope.ACCOUNT_REALM,
                        account: FIRST_ACCOUNT_ID,
                        realm: REALM_ID,
                    },
                    {
                        scope: InvalidationScope.ACCOUNT_REALM,
                        account: FIRST_ACCOUNT_ID,
                        realm: REALM_ID,
                    },
                ],
            });
        });
    });

    describe("[Method] - cleanAccessCachePayload", () => {
        it("[case] - deduplicates invalidations shared by assignments and overrides", () => {
            // Arrange
            const [first] = createAssignments();
            const realm = first.realm;
            const permission = helpers.createPermission({
                id: PERMISSION_ID,
                realm,
            });
            const duplicate = helpers.createPermissionOverride({
                effect: PermissionOverrideEffect.ALLOW,
                account: FIRST_ACCOUNT_ID,
                permission,
                realm,
            });
            const secondRealm = helpers.createRealm({ id: SECOND_REALM_ID });
            const distinct = helpers.createPermissionOverride({
                permission: helpers.createPermission({ realm: secondRealm }),
                effect: PermissionOverrideEffect.DENY,
                account: SECOND_ACCOUNT_ID,
                realm: secondRealm,
            });

            // Act
            const result = mapper.cleanAccessCachePayload({
                overrides: [duplicate, distinct],
                assignments: [first],
            });

            // Assert
            expect(result).toEqual({
                items: [
                    {
                        scope: InvalidationScope.ACCOUNT_REALM,
                        account: FIRST_ACCOUNT_ID,
                        realm: REALM_ID,
                    },
                    {
                        scope: InvalidationScope.ACCOUNT_REALM,
                        account: SECOND_ACCOUNT_ID,
                        realm: SECOND_REALM_ID,
                    },
                ],
            });
        });
    });

    describe("[Behavior] - membership workflow", () => {
        /* eslint-disable prettier/prettier */
        const REALM_ID             = "00000000-0000-4000-8000-600000000001";
        const ROLE_ID              = "00000000-0000-4000-8000-600000000002";
        const SECOND_ROLE_ID       = "00000000-0000-4000-8000-600000000003";
        const FIRST_ASSIGNMENT_ID  = "00000000-0000-4000-8000-600000000006";
        const SECOND_ASSIGNMENT_ID = "00000000-0000-4000-8000-600000000007";
        const ACCOUNT_ID           = "00000000-0000-4000-8000-600000000008";
        const ACTOR_ID             = "00000000-0000-4000-8000-600000000009";
        const INVITE_ID            = "00000000-0000-4000-8000-600000000010";
        const PROCESS_ID           = "00000000-0000-4000-8000-600000000011";
        const COMMAND_ID           = "00000000-0000-4000-8000-600000000012";
        /* eslint-enable prettier/prettier */

        const helpers = new EntityFactoryRegistry();
        const mapper = new AccountRoleAssignmentMapper();

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

        const joinRequest: Topics.Realm.MembershipJoinRequestedMessage["payload"]["input"] = {
            membership: INVITE_ID,
            process: PROCESS_ID,
            command: COMMAND_ID,
            account: ACCOUNT_ID,
            invite: INVITE_ID,
            role: ROLE_ID,
        };

        afterEach(() => {
            jest.restoreAllMocks();
        });

        describe("[Method] - joinAssignmentProjectionPayload", () => {
            it("[case] - maps all created assignments for the joined account", () => {
                // Arrange

                // Act
                const result = mapper.joinAssignmentProjectionPayload({
                    assignments: createAssignments(),
                    request: joinRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                });

                // Assert
                expect(result).toEqual({
                    assignments: [
                        { assignment: FIRST_ASSIGNMENT_ID, role: ROLE_ID },
                        { assignment: SECOND_ASSIGNMENT_ID, role: SECOND_ROLE_ID },
                    ],
                    account: ACCOUNT_ID,
                    realm: REALM_ID,
                });
            });
        });

        describe("[Method] - joinAccessCachePayload", () => {
            it("[case] - maps the joined account-realm invalidation", () => {
                // Arrange

                // Act
                const result = mapper.joinAccessCachePayload({
                    assignments: createAssignments(),
                    request: joinRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                });

                // Assert
                expect(result).toEqual({
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

        describe("[Method] - joinConfirmedPayload", () => {
            it("[case] - maps the first assignment and current timestamp", () => {
                // Arrange
                jest.spyOn(Date, "now").mockReturnValue(1_789_000_000_000);

                // Act
                const result = mapper.joinConfirmedPayload({
                    assignments: createAssignments(),
                    request: joinRequest,
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                });

                // Assert
                expect(result).toEqual({
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: {
                        membership: INVITE_ID,
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

        describe("[Method] - joinRejectedPayload", () => {
            it("[case] - maps rejection context from the original request", () => {
                // Arrange

                // Act
                const result = mapper.joinRejectedPayload({
                    request: {
                        actor: ACTOR_ID,
                        realm: REALM_ID,
                        input: joinRequest,
                    },
                    reason: "role is unavailable",
                });

                // Assert
                expect(result).toEqual({
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: {
                        account: ACCOUNT_ID,
                        membership: INVITE_ID,
                        process: PROCESS_ID,
                        command: COMMAND_ID,
                        invite: INVITE_ID,
                        reason: "role is unavailable",
                    },
                });
            });
        });
    });
});
