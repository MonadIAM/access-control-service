import { ChangeSetType } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { ActionType, EntityType, RoleActorType, RoleArchetype } from "~context/enums";
import { AuditLog, ChangeLog } from "~common/transaction-manager/entities";
import { DeltaChanges } from "~common/transaction-manager/value-objects";
import {
    RolePermissionAssignment,
    AccountRoleAssignment,
    RoleDelegationPolicy,
    RoleConflictMember,
    PermissionOverride,
    RoleConflictGroup,
    RoleClosure,
    Permission,
    Realm,
    Role,
} from "~context/domain/entities";

export class CoreFixture implements Fixtures.Core.Contract {
    private sequence = 0;

    public constructor(protected readonly entityManager: ORM.EntityManager) {}

    public async createRealm(props: Fixtures.Core.CreateRealm.Props = {}): Fixtures.Core.CreateRealm.Result {
        const realm = new Realm({
            code: props.code ?? this.nextCode("realm"),
            isSystemManaged: props.isSystemManaged,
            owner: props.owner ?? randomUUID(),
            name: props.name ?? "Test Realm",
            description: props.description,
            isRevoked: props.isRevoked,
        });

        realm.createdAt = props.createdAt ?? realm.createdAt;

        return await this.persist(realm);
    }

    public async createRole(props: Fixtures.Core.CreateRole.Props): Fixtures.Core.CreateRole.Result {
        const role = await this.createDetachedRole(props);
        await this.createRoleClosure({ realm: props.realm, ancestor: role, descendant: role, depth: 0 });
        return role;
    }

    public async createDetachedRole(
        props: Fixtures.Core.CreateDetachedRole.Props,
    ): Fixtures.Core.CreateDetachedRole.Result {
        return await this.persist(
            new Role({
                archetype: props.archetype ?? RoleArchetype.ATOMIC,
                actorType: props.actorType ?? RoleActorType.HUMAN,
                code: props.code ?? this.nextCode("role"),
                isSystemManaged: props.isSystemManaged,
                name: props.name ?? "Test Role",
                description: props.description,
                isRevoked: props.isRevoked,
                realm: props.realm,
            }),
        );
    }

    public async createPermission(props: Fixtures.Core.CreatePermission.Props): Fixtures.Core.CreatePermission.Result {
        return await this.persist(
            new Permission({
                code: props.code ?? this.nextCode("permission"),
                isSystemManaged: props.isSystemManaged,
                name: props.name ?? "Test Permission",
                description: props.description,
                isRevoked: props.isRevoked,
                realm: props.realm,
            }),
        );
    }

    public async createAccountRoleAssignment(
        props: Fixtures.Core.CreateAccountRoleAssignment.Props,
    ): Fixtures.Core.CreateAccountRoleAssignment.Result {
        return await this.persist(
            new AccountRoleAssignment({
                isSystemManaged: props.isSystemManaged,
                justification: props.justification,
                expiresAt: props.expiresAt,
                isRevoked: props.isRevoked,
                account: props.account,
                realm: props.realm,
                role: props.role,
            }),
        );
    }

    public async createRolePermissionAssignment(
        props: Fixtures.Core.CreateRolePermissionAssignment.Props,
    ): Fixtures.Core.CreateRolePermissionAssignment.Result {
        return await this.persist(
            new RolePermissionAssignment({
                isSystemManaged: props.isSystemManaged,
                permission: props.permission,
                isRevoked: props.isRevoked,
                realm: props.realm,
                role: props.role,
            }),
        );
    }

    public async createRoleDelegationPolicy(
        props: Fixtures.Core.CreateRoleDelegationPolicy.Props,
    ): Fixtures.Core.CreateRoleDelegationPolicy.Result {
        return await this.persist(
            new RoleDelegationPolicy({
                isSystemManaged: props.isSystemManaged,
                justification: props.justification,
                depthLimit: props.depthLimit,
                delegator: props.delegator,
                expiresAt: props.expiresAt,
                isRevoked: props.isRevoked,
                target: props.target,
                realm: props.realm,
            }),
        );
    }

    public async createPermissionOverride(
        props: Fixtures.Core.CreatePermissionOverride.Props,
    ): Fixtures.Core.CreatePermissionOverride.Result {
        return await this.persist(
            new PermissionOverride({
                justification: props.justification,
                permission: props.permission,
                expiresAt: props.expiresAt,
                isRevoked: props.isRevoked,
                account: props.account,
                effect: props.effect,
                realm: props.realm,
            }),
        );
    }

    public async createRoleConflictGroup(
        props: Fixtures.Core.CreateRoleConflictGroup.Props,
    ): Fixtures.Core.CreateRoleConflictGroup.Result {
        return await this.persist(
            new RoleConflictGroup({
                code: props.code ?? this.nextCode("conflict-group"),
                name: props.name ?? "Test Conflict Group",
                isSystemManaged: props.isSystemManaged,
                maxAllowed: props.maxAllowed ?? 1,
                description: props.description,
                isRevoked: props.isRevoked,
                realm: props.realm,
            }),
        );
    }

    public async createRoleConflictMember(
        props: Fixtures.Core.CreateRoleConflictMember.Props,
    ): Fixtures.Core.CreateRoleConflictMember.Result {
        return await this.persist(
            new RoleConflictMember({
                isSystemManaged: props.isSystemManaged,
                isRevoked: props.isRevoked,
                group: props.group,
                role: props.role,
            }),
        );
    }

    public async createRoleClosure(props: Fixtures.Core.CreateRoleClosure.Props): Fixtures.Core.CreateRoleClosure.Result {
        return await this.persist(new RoleClosure(props));
    }

    public async createAuditLog(props: Fixtures.Core.CreateAuditLog.Props = {}): Fixtures.Core.CreateAuditLog.Result {
        const auditLog = new AuditLog({
            actionType: props.actionType ?? ActionType.CREATE,
            entityType: props.entityType ?? EntityType.ROLE,
            actor: props.actor ?? randomUUID(),
            realm: props.realm ?? randomUUID(),
            input: props.input,
            context: {
                ip: props.context?.ip ?? "127.0.0.1",
                userAgent: props.context?.userAgent ?? "integration-test",
            },
        });

        auditLog.sign({ keyVersion: 1, signature: "test-signature" });

        return await this.persist(auditLog);
    }

    public async createChangeLog(props: Fixtures.Core.CreateChangeLog.Props = {}): Fixtures.Core.CreateChangeLog.Result {
        const auditEntry = props.auditEntry ?? (await this.createAuditLog());
        const changeLog = new ChangeLog({
            delta: props.delta ?? new DeltaChanges({ name: { old: null, new: "Updated Name" } }),
            changeType: props.changeType ?? ChangeSetType.CREATE,
            entityType: props.entityType ?? EntityType.ROLE,
            entity: props.entity ?? randomUUID(),
            auditEntry: auditEntry.id,
        });

        changeLog.sign({ keyVersion: 1, signature: "test-signature" });

        return await this.persist(changeLog);
    }

    protected async setCreatedAt<Entity extends { createdAt: Date }>(
        entities: readonly Entity[],
        createdAt: Date,
    ): Promise<void> {
        for (const entity of entities) {
            entity.createdAt = new Date(createdAt);
        }

        await this.entityManager.flush();
    }

    private async persist<Entity extends ORM.AnyEntity>(entity: Entity): Promise<Entity> {
        this.entityManager.persist(entity);
        await this.entityManager.flush();
        return entity;
    }

    private nextCode(prefix: string): string {
        this.sequence += 1;
        return `${prefix}.${this.sequence}`;
    }
}
