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

describe("[DataMapper] - Role", () => {
    describe("[Method] - projectionCreatePayload", () => {
        it("[case] - maps the role, parent and owning realm", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const parent = helpers.createRole({ id: PARENT_ID, realm });
            const entity = helpers.createRole({ id: ROLE_ID, realm });

            // Act
            const result = mapper.projectionCreatePayload({ entity, parent });

            // Assert
            expect(result).toEqual({
                parent: PARENT_ID,
                realm: REALM_ID,
                role: ROLE_ID,
            });
        });
    });

    describe("[Method] - projectionUpdatePayload", () => {
        it("[case] - maps role identifiers and shared realm state", () => {
            // Arrange
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

            // Act
            const result = mapper.projectionUpdatePayload({ roles: [first, second] });

            // Assert
            expect(result).toEqual({
                roles: [ROLE_ID, SECOND_ROLE_ID],
                isRevoked: true,
                realm: REALM_ID,
            });
        });
    });

    describe("[Method] - projectionPurgePayload", () => {
        it("[case] - maps a single purged role", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const role = helpers.createRole({ id: ROLE_ID, realm });

            // Act
            const result = mapper.projectionPurgePayload({ roles: [role] });

            // Assert
            expect(result).toEqual({
                realm: REALM_ID,
                role: ROLE_ID,
            });
        });
    });

    describe("[Method] - projectionSubtreePurgePayload", () => {
        it("[case] - maps the subtree root", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const root = helpers.createRole({ id: ROLE_ID, realm });
            const descendant = helpers.createRole({
                id: SECOND_ROLE_ID,
                realm,
            });

            // Act
            const result = mapper.projectionSubtreePurgePayload({
                entities: [root, descendant],
                root,
            });

            // Assert
            expect(result).toEqual({
                realm: REALM_ID,
                role: ROLE_ID,
            });
        });
    });

    describe("[Method] - projectionMovePayload", () => {
        it("[case] - preserves ordered closure steps and maps the target realm", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const target = helpers.createRole({ id: ROLE_ID, realm });
            const parent = helpers.createRole({ id: PARENT_ID, realm });
            const steps: Services.Role.Move.Steps = [
                {
                    removedPaths: [{ ancestor: parent, descendant: target }],
                    upsertedPaths: [{ ancestor: target, descendant: target, depth: 0 }],
                },
            ];

            // Act
            const result = mapper.projectionMovePayload({ steps, target });

            // Assert
            expect(result).toEqual({ realm: REALM_ID, steps });
            expect(result.steps).toBe(steps);
        });
    });

    describe("[Method] - subtreeAccessCachePayload", () => {
        it("[case] - maps every subtree entity to a realm invalidation", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const root = helpers.createRole({ id: ROLE_ID, realm });
            const descendant = helpers.createRole({
                id: SECOND_ROLE_ID,
                realm,
            });

            // Act
            const result = mapper.subtreeAccessCachePayload({
                entities: [root, descendant],
                root,
            });

            // Assert
            expect(result).toEqual({
                items: [
                    { scope: InvalidationScope.REALM, realm: REALM_ID },
                    { scope: InvalidationScope.REALM, realm: REALM_ID },
                ],
            });
        });
    });

    describe("[Method] - moveAccessCachePayload", () => {
        it("[case] - maps one invalidation for the target realm", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const target = helpers.createRole({ id: ROLE_ID, realm });

            // Act
            const result = mapper.moveAccessCachePayload({ steps: [], target });

            // Assert
            expect(result).toEqual({
                items: [{ scope: InvalidationScope.REALM, realm: REALM_ID }],
            });
        });
    });

    describe("[Method] - accessCachePayload", () => {
        it("[case] - uses each role owning realm", () => {
            // Arrange
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

            // Act
            const result = mapper.accessCachePayload({ roles: [first, second] });

            // Assert
            expect(result).toEqual({
                items: [
                    { scope: InvalidationScope.REALM, realm: REALM_ID },
                    { scope: InvalidationScope.REALM, realm: SECOND_REALM_ID },
                ],
            });
        });
    });
});
