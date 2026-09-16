import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/unit/entity-factory.registry";
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

describe("PermissionMapper", () => {
    describe("projectionCreatePayload", () => {
        it("maps the permission identity, code and owning realm", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const permission = helpers.createPermission({
                id: PERMISSION_ID,
                code: "documents.read",
                realm,
            });

            expect(mapper.projectionCreatePayload({ permission })).toEqual({
                permission: PERMISSION_ID,
                code: "documents.read",
                realm: REALM_ID,
            });
        });
    });

    describe("projectionUpdatePayload", () => {
        it("maps permission identifiers and shared revocation state", () => {
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

            expect(
                mapper.projectionUpdatePayload({
                    permissions: [first, second],
                }),
            ).toEqual({
                permissions: [PERMISSION_ID, SECOND_PERMISSION_ID],
                isRevoked: true,
                realm: REALM_ID,
            });
        });
    });

    describe("projectionPurgePayload", () => {
        it("maps permission identifiers and their owning realm", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const first = helpers.createPermission({
                id: PERMISSION_ID,
                realm,
            });
            const second = helpers.createPermission({
                id: SECOND_PERMISSION_ID,
                realm,
            });

            expect(mapper.projectionPurgePayload({ permissions: [first, second] })).toEqual({
                permissions: [PERMISSION_ID, SECOND_PERMISSION_ID],
                realm: REALM_ID,
            });
        });
    });

    describe("accessCachePayload", () => {
        it("uses each permission owning realm", () => {
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

            expect(mapper.accessCachePayload({ permissions: [first, second] })).toEqual({
                items: [
                    { scope: InvalidationScope.REALM, realm: REALM_ID },
                    { scope: InvalidationScope.REALM, realm: SECOND_REALM_ID },
                ],
            });
        });
    });
});
