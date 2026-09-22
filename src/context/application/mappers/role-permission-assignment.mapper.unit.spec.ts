import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
import { AssignmentScope, InvalidationScope } from "~context/enums";

import { RolePermissionAssignmentMapper } from "./role-permission-assignment.mapper";

/* eslint-disable prettier/prettier */
const REALM_ID             = "00000000-0000-4000-8000-300000000001";
const PERMISSION_REALM_ID  = "00000000-0000-4000-8000-300000000002";
const ROLE_ID              = "00000000-0000-4000-8000-300000000003";
const PERMISSION_ID        = "00000000-0000-4000-8000-300000000004";
const SECOND_PERMISSION_ID = "00000000-0000-4000-8000-300000000005";
const ASSIGNMENT_ID        = "00000000-0000-4000-8000-300000000006";
const SECOND_ASSIGNMENT_ID = "00000000-0000-4000-8000-300000000007";
/* eslint-enable prettier/prettier */

const mapper = new RolePermissionAssignmentMapper();
const helpers = new EntityFactoryRegistry();

function createAssignments(isRevoked = false): Entities.RolePermissionAssignment[] {
    const realm = helpers.createRealm({ id: REALM_ID });
    const permissionRealm = helpers.createRealm({ id: PERMISSION_REALM_ID });
    const role = helpers.createRole({ id: ROLE_ID, realm });
    const firstPermission = helpers.createPermission({
        id: PERMISSION_ID,
        realm: permissionRealm,
    });
    const secondPermission = helpers.createPermission({
        id: SECOND_PERMISSION_ID,
        realm,
    });

    return [
        helpers.createRolePermissionAssignment({
            id: ASSIGNMENT_ID,
            scope: AssignmentScope.GLOBAL,
            permission: firstPermission,
            isRevoked,
            realm,
            role,
        }),
        helpers.createRolePermissionAssignment({
            id: SECOND_ASSIGNMENT_ID,
            scope: AssignmentScope.REALM,
            permission: secondPermission,
            isRevoked,
            realm,
            role,
        }),
    ];
}

describe("RolePermissionAssignmentMapper", () => {
    describe("projectionCreatePayload", () => {
        it("maps assignment scopes and permission owning realms", () => {
            expect(
                mapper.projectionCreatePayload({
                    assignments: createAssignments(),
                }),
            ).toEqual({
                assignments: [
                    {
                        permissionRealm: PERMISSION_REALM_ID,
                        permission: PERMISSION_ID,
                        assignment: ASSIGNMENT_ID,
                        scope: AssignmentScope.GLOBAL,
                    },
                    {
                        permissionRealm: REALM_ID,
                        permission: SECOND_PERMISSION_ID,
                        assignment: SECOND_ASSIGNMENT_ID,
                        scope: AssignmentScope.REALM,
                    },
                ],
                realm: REALM_ID,
                role: ROLE_ID,
            });
        });
    });

    describe("projectionUpdatePayload", () => {
        it("maps canonical assignment identities and revocation state", () => {
            expect(
                mapper.projectionUpdatePayload({
                    assignments: createAssignments(true),
                }),
            ).toEqual({
                isRevoked: true,
                realm: REALM_ID,
                items: [
                    {
                        permissionRealm: PERMISSION_REALM_ID,
                        permission: PERMISSION_ID,
                        assignment: ASSIGNMENT_ID,
                        realm: REALM_ID,
                        role: ROLE_ID,
                    },
                    {
                        permissionRealm: REALM_ID,
                        permission: SECOND_PERMISSION_ID,
                        assignment: SECOND_ASSIGNMENT_ID,
                        realm: REALM_ID,
                        role: ROLE_ID,
                    },
                ],
            });
        });
    });

    describe("projectionPurgePayload", () => {
        it("maps relation keys without assignment identifiers", () => {
            expect(
                mapper.projectionPurgePayload({
                    assignments: createAssignments(),
                }),
            ).toEqual({
                realm: REALM_ID,
                items: [
                    {
                        permissionRealm: PERMISSION_REALM_ID,
                        permission: PERMISSION_ID,
                        realm: REALM_ID,
                        role: ROLE_ID,
                    },
                    {
                        permissionRealm: REALM_ID,
                        permission: SECOND_PERMISSION_ID,
                        realm: REALM_ID,
                        role: ROLE_ID,
                    },
                ],
            });
        });
    });

    describe("accessCachePayload", () => {
        it("maps one realm invalidation per assignment", () => {
            expect(mapper.accessCachePayload({ assignments: createAssignments() })).toEqual({
                items: [
                    { scope: InvalidationScope.REALM, realm: REALM_ID },
                    { scope: InvalidationScope.REALM, realm: REALM_ID },
                ],
            });
        });
    });
});
