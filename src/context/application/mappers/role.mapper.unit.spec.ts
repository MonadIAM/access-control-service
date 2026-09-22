import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
import { InvalidationScope } from "~context/enums";

import { RoleMapper } from "./role.mapper";

/* eslint-disable prettier/prettier */
const REALM_ID        = "00000000-0000-4000-8000-100000000001";
const SECOND_REALM_ID = "00000000-0000-4000-8000-100000000002";
const PARENT_ID       = "00000000-0000-4000-8000-100000000003";
const ROLE_ID         = "00000000-0000-4000-8000-100000000004";
const SECOND_ROLE_ID  = "00000000-0000-4000-8000-100000000005";
/* eslint-enable prettier/prettier */

const helpers = new EntityFactoryRegistry();
const mapper = new RoleMapper();

describe("RoleMapper", () => {
    describe("projectionCreatePayload", () => {
        it("maps the role, parent and owning realm", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const parent = helpers.createRole({ id: PARENT_ID, realm });
            const entity = helpers.createRole({ id: ROLE_ID, realm });

            expect(mapper.projectionCreatePayload({ entity, parent })).toEqual({
                parent: PARENT_ID,
                realm: REALM_ID,
                role: ROLE_ID,
            });
        });
    });

    describe("projectionUpdatePayload", () => {
        it("maps role identifiers and shared realm state", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const first = helpers.createRole({
                id: ROLE_ID,
                isRevoked: true,
                realm,
            });
            const second = helpers.createRole({
                id: SECOND_ROLE_ID,
                isRevoked: true,
                realm,
            });

            expect(mapper.projectionUpdatePayload({ roles: [first, second] })).toEqual({
                roles: [ROLE_ID, SECOND_ROLE_ID],
                isRevoked: true,
                realm: REALM_ID,
            });
        });
    });

    describe("projectionPurgePayload", () => {
        it("maps a single purged role", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const role = helpers.createRole({ id: ROLE_ID, realm });

            expect(mapper.projectionPurgePayload({ roles: [role] })).toEqual({
                realm: REALM_ID,
                role: ROLE_ID,
            });
        });
    });

    describe("projectionSubtreePurgePayload", () => {
        it("maps the subtree root", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const root = helpers.createRole({ id: ROLE_ID, realm });
            const descendant = helpers.createRole({
                id: SECOND_ROLE_ID,
                realm,
            });

            expect(
                mapper.projectionSubtreePurgePayload({
                    entities: [root, descendant],
                    root,
                }),
            ).toEqual({
                realm: REALM_ID,
                role: ROLE_ID,
            });
        });
    });

    describe("projectionMovePayload", () => {
        it("preserves ordered closure steps and maps the target realm", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const target = helpers.createRole({ id: ROLE_ID, realm });
            const parent = helpers.createRole({ id: PARENT_ID, realm });
            const steps: Services.Role.Move.Steps = [
                {
                    removedPaths: [{ ancestor: parent, descendant: target }],
                    upsertedPaths: [{ ancestor: target, descendant: target, depth: 0 }],
                },
            ];

            const result = mapper.projectionMovePayload({ steps, target });

            expect(result).toEqual({ realm: REALM_ID, steps });
            expect(result.steps).toBe(steps);
        });
    });

    describe("subtreeAccessCachePayload", () => {
        it("maps every subtree entity to a realm invalidation", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const root = helpers.createRole({ id: ROLE_ID, realm });
            const descendant = helpers.createRole({
                id: SECOND_ROLE_ID,
                realm,
            });

            expect(
                mapper.subtreeAccessCachePayload({
                    entities: [root, descendant],
                    root,
                }),
            ).toEqual({
                items: [
                    { scope: InvalidationScope.REALM, realm: REALM_ID },
                    { scope: InvalidationScope.REALM, realm: REALM_ID },
                ],
            });
        });
    });

    describe("moveAccessCachePayload", () => {
        it("maps one invalidation for the target realm", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const target = helpers.createRole({ id: ROLE_ID, realm });

            expect(mapper.moveAccessCachePayload({ steps: [], target })).toEqual({
                items: [{ scope: InvalidationScope.REALM, realm: REALM_ID }],
            });
        });
    });

    describe("accessCachePayload", () => {
        it("uses each role owning realm", () => {
            const firstRealm = helpers.createRealm({ id: REALM_ID });
            const secondRealm = helpers.createRealm({ id: SECOND_REALM_ID });
            const first = helpers.createRole({
                id: ROLE_ID,
                realm: firstRealm,
            });
            const second = helpers.createRole({
                id: SECOND_ROLE_ID,
                realm: secondRealm,
            });

            expect(mapper.accessCachePayload({ roles: [first, second] })).toEqual({
                items: [
                    { scope: InvalidationScope.REALM, realm: REALM_ID },
                    { scope: InvalidationScope.REALM, realm: SECOND_REALM_ID },
                ],
            });
        });
    });
});
