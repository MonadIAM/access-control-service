import { describe, expect, it } from "@jest/globals";
import { SYSTEM_REALM_ID } from "@monadiam/shared";

import { AssignmentScope, InvalidationScope, RealmType } from "~context/enums";
import { EntityFactoryRegistry } from "~testing/entity-factory.registry";

import { RealmMapper } from "./realm.mapper";

/* eslint-disable prettier/prettier */
const REALM_ID              = "00000000-0000-4000-8000-000000000001";
const SECOND_REALM_ID       = "00000000-0000-4000-8000-000000000002";
const ROOT_ROLE_ID          = "00000000-0000-4000-8000-000000000003";
const USER_ROLE_ID          = "00000000-0000-4000-8000-000000000004";
const PERMISSION_ID         = "00000000-0000-4000-8000-000000000005";
const ROLE_ASSIGNMENT_ID    = "00000000-0000-4000-8000-000000000006";
const ACCOUNT_ASSIGNMENT_ID = "00000000-0000-4000-8000-000000000007";
const ACCOUNT_ID            = "00000000-0000-4000-8000-000000000008";
const ACTOR_ID              = "00000000-0000-4000-8000-000000000009";
/* eslint-enable prettier/prettier */

const helpers = new EntityFactoryRegistry();
const mapper = new RealmMapper();

describe("RealmMapper", () => {
    describe("projectionCreatePayload", () => {
        it("maps the complete realm bootstrap projection", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const root = helpers.createRole({ id: ROOT_ROLE_ID, realm });
            const user = helpers.createRole({ id: USER_ROLE_ID, realm });
            const permissionRealm = helpers.createRealm({
                id: SYSTEM_REALM_ID,
            });
            const permission = helpers.createPermission({
                id: PERMISSION_ID,
                realm: permissionRealm,
            });
            const permissionAssignment = helpers.createRolePermissionAssignment({
                id: ROLE_ASSIGNMENT_ID,
                scope: AssignmentScope.GLOBAL,
                role: root,
                permission,
                realm,
            });
            const accountAssignment = helpers.createAccountRoleAssignment({
                id: ACCOUNT_ASSIGNMENT_ID,
                account: ACCOUNT_ID,
                role: user,
                realm,
            });

            const result = mapper.projectionCreatePayload({
                assignments: {
                    permission: [permissionAssignment],
                    role: [accountAssignment],
                },
                paths: [{ ancestor: root, descendant: root, depth: 0, realm }],
                roles: [root, user],
                realm,
            });

            expect(result).toEqual({
                rolePermissionAssignments: [
                    {
                        permission: PERMISSION_ID,
                        assignment: ROLE_ASSIGNMENT_ID,
                        role: ROOT_ROLE_ID,
                        scope: AssignmentScope.GLOBAL,
                    },
                ],
                accountRoleAssignments: [
                    {
                        assignment: ACCOUNT_ASSIGNMENT_ID,
                        role: USER_ROLE_ID,
                        account: ACCOUNT_ID,
                    },
                ],
                paths: [
                    {
                        descendant: ROOT_ROLE_ID,
                        ancestor: ROOT_ROLE_ID,
                        depth: 0,
                    },
                ],
                permissionRealm: SYSTEM_REALM_ID,
                roles: [ROOT_ROLE_ID, USER_ROLE_ID],
                realm: REALM_ID,
            });
        });
    });

    describe("projectionUpdatePayload", () => {
        it("maps each realm with its own revocation state", () => {
            const first = helpers.createRealm({
                id: REALM_ID,
                isRevoked: true,
            });
            const second = helpers.createRealm({
                id: SECOND_REALM_ID,
                isRevoked: false,
            });

            expect(mapper.projectionUpdatePayload({ realms: [first, second] })).toEqual([
                { isRevoked: true, realm: REALM_ID },
                { isRevoked: false, realm: SECOND_REALM_ID },
            ]);
        });
    });

    describe("projectionPurgePayload", () => {
        it("maps every purged realm to an independent payload", () => {
            const first = helpers.createRealm({ id: REALM_ID });
            const second = helpers.createRealm({ id: SECOND_REALM_ID });

            expect(mapper.projectionPurgePayload({ realms: [first, second] })).toEqual([
                { realm: REALM_ID },
                { realm: SECOND_REALM_ID },
            ]);
        });
    });

    describe("accessCachePayload", () => {
        it("maps realm-scoped invalidations", () => {
            const first = helpers.createRealm({ id: REALM_ID });
            const second = helpers.createRealm({ id: SECOND_REALM_ID });

            expect(mapper.accessCachePayload({ realms: [first, second] })).toEqual({
                items: [
                    { scope: InvalidationScope.REALM, realm: REALM_ID },
                    { scope: InvalidationScope.REALM, realm: SECOND_REALM_ID },
                ],
            });
        });
    });

    describe("realmLifecyclePayload", () => {
        it("maps project realms only, without involving Identity in organization realm operations", () => {
            const first = helpers.createRealm({ id: REALM_ID, version: 3, type: RealmType.PROJECT });
            const second = helpers.createRealm({
                id: SECOND_REALM_ID,
                version: 7,
                type: RealmType.PROJECT,
            });

            expect(
                mapper.realmLifecyclePayload({
                    actor: ACTOR_ID,
                    realms: [first, second, helpers.createRealm({ type: RealmType.ORGANIZATION })],
                }),
            ).toEqual([
                { actor: ACTOR_ID, realm: REALM_ID, input: { version: 4 } },
                {
                    actor: ACTOR_ID,
                    realm: SECOND_REALM_ID,
                    input: { version: 8 },
                },
            ]);
        });
    });

    describe("accessAssignmentUpdate", () => {
        it("preserves mixed revocation states when rebuilding assignment projections", () => {
            const realm = helpers.createRealm();
            const account = "account";
            const active = helpers.createAccountRoleAssignment({ realm, account, isRevoked: false });
            const manual = helpers.createAccountRoleAssignment({ realm, account, isRevoked: true });

            const payloads = mapper.accessAssignmentUpdate({
                assignments: [active, manual],
                overrides: [],
                realm: realm.id,
                account,
            });

            expect(payloads.map(({ isRevoked }) => isRevoked)).toEqual([false, true]);
            expect(payloads.map(({ items }) => items[0].assignment)).toEqual([active.id, manual.id]);
        });
    });

    describe("accessOverrideUpdate", () => {
        it("preserves mixed revocation states and permission realms in override projections", () => {
            const realm = helpers.createRealm();
            const permissionRealm = helpers.createRealm();
            const permission = helpers.createPermission({ realm: permissionRealm });
            const account = "account";
            const active = helpers.createPermissionOverride({ realm, permission, account, isRevoked: false });
            const manual = helpers.createPermissionOverride({ realm, permission, account, isRevoked: true });

            const payloads = mapper.accessOverrideUpdate({
                assignments: [],
                overrides: [active, manual],
                realm: realm.id,
                account,
            });

            expect(payloads.map(({ isRevoked }) => isRevoked)).toEqual([false, true]);
            expect(payloads.map(({ items }) => items[0].permissionRealm)).toEqual([permissionRealm.id, permissionRealm.id]);
        });
    });
});
