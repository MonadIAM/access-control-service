import { SYSTEM_REALM_ID } from "@monadiam/shared";

import { InvalidationScope, RealmType } from "~context/enums";

export class RealmMapper implements Commands.Mappers.Realm.Contract {
    public projectionCreatePayload(
        props: Commands.Mappers.Realm.ProjectionCreatePayload.Props,
    ): Commands.Mappers.Realm.ProjectionCreatePayload.Result {
        const { assignments, paths, realm, roles } = props;

        return {
            rolePermissionAssignments: assignments.permission.map(({ id, role, permission, scope }) => ({
                permission: permission.id,
                assignment: id,
                role: role.id,
                scope,
            })),
            accountRoleAssignments: assignments.role.map(({ id, account, role, expiresAt }) => ({
                expiresAt: expiresAt?.getTime() ?? null,
                assignment: id,
                role: role.id,
                account,
            })),
            paths: paths.map(({ ancestor, descendant, depth }) => ({
                descendant: descendant.id,
                ancestor: ancestor.id,
                depth,
            })),
            roles: roles.map(({ id }) => id),
            permissionRealm: SYSTEM_REALM_ID,
            realm: realm.id,
        };
    }

    public projectionPurgePayload(
        props: Commands.Mappers.Realm.ProjectionPurgePayload.Props,
    ): Commands.Mappers.Realm.ProjectionPurgePayload.Result {
        return props.realms.map(({ id: realm }) => ({ realm }));
    }

    public projectionUpdatePayload(
        props: Commands.Mappers.Realm.ProjectionUpdatePayload.Props,
    ): Commands.Mappers.Realm.ProjectionUpdatePayload.Result {
        return props.realms.map(({ id: realm, isRevoked }) => ({ isRevoked, realm }));
    }

    public accessCachePayload(
        props: Commands.Mappers.Realm.AccessCachePayload.Props,
    ): Commands.Mappers.Realm.AccessCachePayload.Result {
        const checkpoints = new Map<string, Topics.ProjectionJournal.Checkpoint["payload"]>();

        for (const entity of props.realms) {
            const realm = entity.id;
            let checkpoint = checkpoints.get(realm);
            if (!checkpoint) {
                checkpoint = { realm, items: [] };
                checkpoints.set(realm, checkpoint);
                checkpoint.items.push({ scope: InvalidationScope.REALM, realm });
            }
        }

        return Array.from(checkpoints.values());
    }

    public realmLifecyclePayload(
        props: Commands.Mappers.Realm.RealmLifecyclePayload.Props,
    ): Commands.Mappers.Realm.RealmLifecyclePayload.Result {
        const result: Commands.Mappers.Realm.RealmLifecyclePayload.Result = [];

        for (const { id, type, version } of props.realms) {
            if (type === RealmType.PROJECT) {
                result.push({
                    input: { version: version + 1 },
                    actor: props.actor,
                    realm: id,
                });
            }
        }

        return result;
    }

    public bootstrapConfirmed(
        props: Commands.Mappers.Realm.BootstrapConfirmed.Props,
    ): Commands.Mappers.Realm.BootstrapConfirmed.Result {
        return {
            actor: props.request.actor,
            realm: props.request.realm,
            input: {
                type: "organizationRealm" in props.request.input ? RealmType.PROJECT : RealmType.ORGANIZATION,
                process: props.request.input.process,
                resource: props.request.input.resource,
            },
        };
    }

    public bootstrapRejected(
        props: Commands.Mappers.Realm.BootstrapRejected.Props,
    ): Commands.Mappers.Realm.BootstrapRejected.Result {
        return {
            actor: props.request.actor,
            realm: props.request.realm,
            input: {
                type: "organizationRealm" in props.request.input ? RealmType.PROJECT : RealmType.ORGANIZATION,
                process: props.request.input.process,
                resource: props.request.input.resource,
                reason: props.reason,
            },
        };
    }

    public transferConfirmed(
        props: Commands.Mappers.Realm.TransferConfirmed.Props,
    ): Commands.Mappers.Realm.TransferConfirmed.Result {
        return props.request;
    }

    public transferRejected(
        props: Commands.Mappers.Realm.TransferRejected.Props,
    ): Commands.Mappers.Realm.TransferRejected.Result {
        return { ...props.request, input: { ...props.request.input, reason: props.reason } };
    }

    public transferAssignmentPurge(
        props: Commands.Mappers.Realm.TransferAssignmentPurge.Props,
    ): Commands.Mappers.Realm.TransferAssignmentPurge.Result {
        return props.previousAssignments.map(({ account, role, realm }) => ({
            realm: realm.id,
            items: [{ realm: realm.id, role: role.id, account }],
        }));
    }

    public transferAssignmentCreate(
        props: Commands.Mappers.Realm.TransferAssignmentCreate.Props,
    ): Commands.Mappers.Realm.TransferAssignmentCreate.Result {
        return {
            realm: props.realm.id,
            account: props.request.input.owner,
            assignments: props.assignments.map(({ id, role, expiresAt }) => ({
                expiresAt: expiresAt?.getTime() ?? null,
                assignment: id,
                role: role.id,
            })),
        };
    }

    public transferAccessCache(
        props: Commands.Mappers.Realm.TransferAccessCache.Props,
    ): Commands.Mappers.Realm.TransferAccessCache.Result {
        const checkpoints = new Map<string, Topics.ProjectionJournal.Checkpoint["payload"]>();
        const seen = new Set<string>();

        for (const entity of [props.request.input.previousOwner, props.request.input.owner]) {
            const realm = props.realm.id;
            const account = entity;
            const key = `${realm}:${account}`;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            let checkpoint = checkpoints.get(realm);
            if (!checkpoint) {
                checkpoint = { realm, items: [] };
                checkpoints.set(realm, checkpoint);
            }
            checkpoint.items.push({ scope: InvalidationScope.ACCOUNT_REALM, realm, account });
        }

        return Array.from(checkpoints.values());
    }

    public accessAssignmentPurge(
        props: Commands.Mappers.Realm.AccessAssignmentPurge.Props,
    ): Commands.Mappers.Realm.AccessAssignmentPurge.Result {
        return props.assignments.map(({ account, role, realm }) => ({
            realm: realm.id,
            items: [{ realm: realm.id, role: role.id, account }],
        }));
    }

    public accessOverridePurge(
        props: Commands.Mappers.Realm.AccessOverridePurge.Props,
    ): Commands.Mappers.Realm.AccessOverridePurge.Result {
        return props.overrides.map(({ account, permission, realm }) => ({
            realm: realm.id,
            items: [{ permissionRealm: permission.realm.id, permission: permission.id, realm: realm.id, account }],
        }));
    }

    public accessAssignmentUpdate(
        props: Commands.Mappers.Realm.AccessAssignmentUpdate.Props,
    ): Commands.Mappers.Realm.AccessAssignmentUpdate.Result {
        return props.assignments.map(({ id, account, role, realm, isRevoked, expiresAt }) => ({
            realm: realm.id,
            isRevoked,
            items: [{ assignment: id, realm: realm.id, role: role.id, account, expiresAt: expiresAt?.getTime() ?? null }],
        }));
    }

    public accessOverrideUpdate(
        props: Commands.Mappers.Realm.AccessOverrideUpdate.Props,
    ): Commands.Mappers.Realm.AccessOverrideUpdate.Result {
        return props.overrides.map(({ id, account, permission, realm, effect, isRevoked, expiresAt }) => ({
            realm: realm.id,
            isRevoked,
            items: [
                {
                    override: id,
                    expiresAt: expiresAt?.getTime() ?? null,
                    permissionRealm: permission.realm.id,
                    permission: permission.id,
                    realm: realm.id,
                    account,
                    effect,
                },
            ],
        }));
    }

    public accessCache(props: Commands.Mappers.Realm.AccessCache.Props): Commands.Mappers.Realm.AccessCache.Result {
        const checkpoints = new Map<string, Topics.ProjectionJournal.Checkpoint["payload"]>();
        const seen = new Set<string>();

        for (const entity of [props]) {
            const realm = entity.realm;
            const account = entity.account;
            const key = `${realm}:${account}`;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            let checkpoint = checkpoints.get(realm);
            if (!checkpoint) {
                checkpoint = { realm, items: [] };
                checkpoints.set(realm, checkpoint);
            }
            checkpoint.items.push({ scope: InvalidationScope.ACCOUNT_REALM, realm, account });
        }

        return Array.from(checkpoints.values());
    }
}
