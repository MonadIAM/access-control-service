import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
import { InvalidationScope } from "~context/enums";

import { PermissionMapper } from "./permission.mapper";

/* eslint-disable prettier/prettier */
const REALM_ID             = "00000000-0000-4000-8000-200000000001";
const SECOND_REALM_ID      = "00000000-0000-4000-8000-200000000002";
const PERMISSION_ID        = "00000000-0000-4000-8000-200000000003";
const SECOND_PERMISSION_ID = "00000000-0000-4000-8000-200000000004";
/* eslint-enable prettier/prettier */

const helpers = new EntityFactoryRegistry();
const mapper = new PermissionMapper();

describe("[DataMapper] - Permission", () => {
    describe("[Method] - projectionCreatePayload", () => {
        it("[case] - maps the permission identity, code and owning realm", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const permission = helpers.createPermission({
                id: PERMISSION_ID,
                code: "documents.read",
                realm,
            });

            // Act
            const result = mapper.projectionCreatePayload({ permission });

            // Assert
            expect(result).toEqual({
                permission: PERMISSION_ID,
                code: "documents.read",
                realm: REALM_ID,
            });
        });
    });

    describe("[Method] - projectionUpdatePayload", () => {
        it("[case] - maps permission identifiers and shared revocation state", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const first = helpers.createPermission({
                id: PERMISSION_ID,
                isRevoked: true,
                realm,
            });
            const second = helpers.createPermission({
                id: SECOND_PERMISSION_ID,
                isRevoked: true,
                realm,
            });

            // Act
            const result = mapper.projectionUpdatePayload({
                permissions: [first, second],
            });

            // Assert
            expect(result).toEqual({
                permissions: [PERMISSION_ID, SECOND_PERMISSION_ID],
                isRevoked: true,
                realm: REALM_ID,
            });
        });
    });

    describe("[Method] - projectionPurgePayload", () => {
        it("[case] - maps permission identifiers and their owning realm", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const first = helpers.createPermission({
                id: PERMISSION_ID,
                realm,
            });
            const second = helpers.createPermission({
                id: SECOND_PERMISSION_ID,
                realm,
            });

            // Act
            const result = mapper.projectionPurgePayload({ permissions: [first, second] });

            // Assert
            expect(result).toEqual({
                permissions: [PERMISSION_ID, SECOND_PERMISSION_ID],
                realm: REALM_ID,
            });
        });
    });

    describe("[Method] - accessCachePayload", () => {
        it("[case] - uses each permission owning realm", () => {
            // Arrange
            const firstRealm = helpers.createRealm({ id: REALM_ID });
            const secondRealm = helpers.createRealm({ id: SECOND_REALM_ID });
            const first = helpers.createPermission({
                id: PERMISSION_ID,
                realm: firstRealm,
            });
            const second = helpers.createPermission({
                id: SECOND_PERMISSION_ID,
                realm: secondRealm,
            });

            // Act
            const result = mapper.accessCachePayload({ permissions: [first, second] });

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
