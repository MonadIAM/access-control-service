import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/unit/entity-factory.registry";
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

describe("AccountRoleAssignmentMapper", () => {
    describe("groupByRealm", () => {
        it("groups assignments by owning realm and preserves their order", () => {
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

            const result = mapper.groupByRealm({
                assignments: [first, third, second],
            });

            expect([...result.keys()]).toEqual([REALM_ID, SECOND_REALM_ID]);
            expect(result.get(REALM_ID)).toEqual([first, second]);
            expect(result.get(SECOND_REALM_ID)).toEqual([third]);
        });
    });

    describe("projectionCreatePayload", () => {
        it("maps all assignments for one account and realm", () => {
            expect(
                mapper.projectionCreatePayload({
                    assignments: createAssignments(),
                }),
            ).toEqual({
                assignments: [
                    { assignment: FIRST_ASSIGNMENT_ID, role: FIRST_ROLE_ID },
                    { assignment: SECOND_ASSIGNMENT_ID, role: SECOND_ROLE_ID },
                ],
                account: FIRST_ACCOUNT_ID,
                realm: REALM_ID,
            });
        });
    });

    describe("projectionAssignPayload", () => {
        it("maps the direct assignment entity", () => {
            const [assignment] = createAssignments();

            expect(mapper.projectionAssignPayload({ assignments: [assignment] })).toEqual({
                assignments: [{ assignment: FIRST_ASSIGNMENT_ID, role: FIRST_ROLE_ID }],
                account: FIRST_ACCOUNT_ID,
                realm: REALM_ID,
            });
        });
    });

    describe("projectionUpdatePayload", () => {
        it("splits updates by realm and uses each group revocation state", () => {
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

            expect(
                mapper.projectionUpdatePayload({
                    assignments: [first, third, second],
                }),
            ).toEqual([
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

    describe("projectionPurgePayload", () => {
        it("splits relation cleanup by realm", () => {
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

            expect(
                mapper.projectionPurgePayload({
                    assignments: [first, third, second],
                }),
            ).toEqual([
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

    describe("notificationGrantPayload", () => {
        it("maps a grouped grant notification", () => {
            expect(
                mapper.notificationGrantPayload({
                    actor: ACTOR_ID,
                    assignments: createAssignments(),
                }),
            ).toEqual({
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

    describe("notificationRevokePayload", () => {
        it("groups revoke notifications by account", () => {
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

            expect(
                mapper.notificationRevokePayload({
                    assignments: [first, third, second],
                    actor: ACTOR_ID,
                }),
            ).toEqual([
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

    describe("accessCachePayload", () => {
        it("maps account-realm invalidations", () => {
            expect(mapper.accessCachePayload({ assignments: createAssignments() })).toEqual({
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

    describe("cleanAccessCachePayload", () => {
        it("deduplicates invalidations shared by assignments and overrides", () => {
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

            expect(
                mapper.cleanAccessCachePayload({
                    overrides: [duplicate, distinct],
                    assignments: [first],
                }),
            ).toEqual({
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
});
