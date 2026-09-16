import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/unit/entity-factory.registry";
import { InvalidationScope, PermissionOverrideEffect } from "~context/enums";

import { PermissionOverrideMapper } from "./permission-override.mapper";

/* eslint-disable prettier/prettier */
const REALM_ID             = "00000000-0000-4000-8000-500000000001";
const SECOND_REALM_ID      = "00000000-0000-4000-8000-500000000002";
const PERMISSION_REALM_ID  = "00000000-0000-4000-8000-500000000003";
const PERMISSION_ID        = "00000000-0000-4000-8000-500000000004";
const SECOND_PERMISSION_ID = "00000000-0000-4000-8000-500000000005";
const OVERRIDE_ID          = "00000000-0000-4000-8000-500000000006";
const SECOND_OVERRIDE_ID   = "00000000-0000-4000-8000-500000000007";
const ACCOUNT_ID           = "00000000-0000-4000-8000-500000000008";
const SECOND_ACCOUNT_ID    = "00000000-0000-4000-8000-500000000009";
/* eslint-enable prettier/prettier */

const mapper = new PermissionOverrideMapper();
const helpers = new EntityFactoryRegistry();

function createOverride(
    props: {
        permissionRealm?: Entities.Realm;
        effect?: PermissionOverrideEffect;
        realm?: Entities.Realm;
        isRevoked?: boolean;
        permission?: string;
        override?: string;
        account?: string;
    } = {},
): Entities.PermissionOverride {
    const realm = props.realm ?? helpers.createRealm({ id: REALM_ID });
    const permissionRealm = props.permissionRealm ?? helpers.createRealm({ id: PERMISSION_REALM_ID });
    const permission = helpers.createPermission({
        id: props.permission ?? PERMISSION_ID,
        realm: permissionRealm,
    });

    return helpers.createPermissionOverride({
        id: props.override ?? OVERRIDE_ID,
        effect: props.effect ?? PermissionOverrideEffect.ALLOW,
        account: props.account ?? ACCOUNT_ID,
        isRevoked: props.isRevoked ?? false,
        permission,
        realm,
    });
}

describe("PermissionOverrideMapper", () => {
    describe("groupByRealm", () => {
        it("groups overrides by target realm and preserves their order", () => {
            const first = createOverride();
            const second = createOverride({
                override: SECOND_OVERRIDE_ID,
                permission: SECOND_PERMISSION_ID,
            });
            const secondRealm = helpers.createRealm({ id: SECOND_REALM_ID });
            const third = createOverride({
                account: SECOND_ACCOUNT_ID,
                realm: secondRealm,
            });

            const result = mapper.groupByRealm({
                overrides: [first, third, second],
            });

            expect([...result.keys()]).toEqual([REALM_ID, SECOND_REALM_ID]);
            expect(result.get(REALM_ID)).toEqual([first, second]);
            expect(result.get(SECOND_REALM_ID)).toEqual([third]);
        });
    });

    describe("projectionCreatePayload", () => {
        it("maps target and permission realms independently", () => {
            const override = createOverride({
                effect: PermissionOverrideEffect.DENY,
            });

            expect(mapper.projectionCreatePayload({ overrides: [override] })).toEqual({
                permissionRealm: PERMISSION_REALM_ID,
                effect: PermissionOverrideEffect.DENY,
                permission: PERMISSION_ID,
                override: OVERRIDE_ID,
                account: ACCOUNT_ID,
                realm: REALM_ID,
            });
        });
    });

    describe("projectionUpdatePayload", () => {
        it("splits updates by target realm", () => {
            const first = createOverride({ isRevoked: true });
            const secondRealm = helpers.createRealm({ id: SECOND_REALM_ID });
            const second = createOverride({
                permissionRealm: secondRealm,
                effect: PermissionOverrideEffect.DENY,
                permission: SECOND_PERMISSION_ID,
                override: SECOND_OVERRIDE_ID,
                account: SECOND_ACCOUNT_ID,
                isRevoked: false,
                realm: secondRealm,
            });

            expect(mapper.projectionUpdatePayload({ overrides: [first, second] })).toEqual([
                {
                    isRevoked: true,
                    realm: REALM_ID,
                    items: [
                        {
                            permissionRealm: PERMISSION_REALM_ID,
                            effect: PermissionOverrideEffect.ALLOW,
                            permission: PERMISSION_ID,
                            override: OVERRIDE_ID,
                            account: ACCOUNT_ID,
                            realm: REALM_ID,
                        },
                    ],
                },
                {
                    isRevoked: false,
                    realm: SECOND_REALM_ID,
                    items: [
                        {
                            permissionRealm: SECOND_REALM_ID,
                            effect: PermissionOverrideEffect.DENY,
                            permission: SECOND_PERMISSION_ID,
                            override: SECOND_OVERRIDE_ID,
                            account: SECOND_ACCOUNT_ID,
                            realm: SECOND_REALM_ID,
                        },
                    ],
                },
            ]);
        });
    });

    describe("projectionPurgePayload", () => {
        it("splits relation cleanup by target realm", () => {
            const first = createOverride();
            const secondRealm = helpers.createRealm({ id: SECOND_REALM_ID });
            const second = createOverride({
                permissionRealm: secondRealm,
                permission: SECOND_PERMISSION_ID,
                account: SECOND_ACCOUNT_ID,
                realm: secondRealm,
            });

            expect(mapper.projectionPurgePayload({ overrides: [first, second] })).toEqual([
                {
                    realm: REALM_ID,
                    items: [
                        {
                            permissionRealm: PERMISSION_REALM_ID,
                            permission: PERMISSION_ID,
                            account: ACCOUNT_ID,
                            realm: REALM_ID,
                        },
                    ],
                },
                {
                    realm: SECOND_REALM_ID,
                    items: [
                        {
                            permissionRealm: SECOND_REALM_ID,
                            permission: SECOND_PERMISSION_ID,
                            account: SECOND_ACCOUNT_ID,
                            realm: SECOND_REALM_ID,
                        },
                    ],
                },
            ]);
        });
    });

    describe("accessCachePayload", () => {
        it("maps account-realm invalidations", () => {
            const first = createOverride();
            const secondRealm = helpers.createRealm({ id: SECOND_REALM_ID });
            const second = createOverride({
                account: SECOND_ACCOUNT_ID,
                realm: secondRealm,
            });

            expect(mapper.accessCachePayload({ overrides: [first, second] })).toEqual({
                items: [
                    {
                        scope: InvalidationScope.ACCOUNT_REALM,
                        account: ACCOUNT_ID,
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
