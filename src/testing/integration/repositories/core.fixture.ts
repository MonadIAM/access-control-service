import { ChangeSetType } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { DeltaChanges } from "~common/transaction-manager/value-objects";
import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
import { ActionType, EntityType } from "~context/enums";

export class CoreFixture implements Fixtures.Core.Contract {
    private readonly entities = new EntityFactoryRegistry();
    private sequence = 0;

    public constructor(protected readonly entityManager: ORM.EntityManager) {}

    private async persist<Entity extends ORM.AnyEntity>(entity: Entity): Promise<Entity> {
        this.entityManager.persist(entity);
        await this.entityManager.flush();
        return entity;
    }

    private nextCode(prefix: string): string {
        this.sequence += 1;
        return `${prefix}.${this.sequence}`;
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

    public async createRole(props: Fixtures.Core.CreateRole.Props): Fixtures.Core.CreateRole.Result {
        const role = await this.createDetachedRole(props);
        await this.createRoleClosure({ realm: props.realm, ancestor: role, descendant: role, depth: 0 });
        return role;
    }

    public async createRealm(props: Fixtures.Core.CreateRealm.Props = {}): Fixtures.Core.CreateRealm.Result {
        return await this.persist(
            this.entities.createRealm({
                ...props,
                code: props.code ?? this.nextCode("realm"),
                owner: props.owner ?? randomUUID(),
                name: props.name ?? "Test Realm",
            }),
        );
    }

    public async createDetachedRole(
        props: Fixtures.Core.CreateDetachedRole.Props,
    ): Fixtures.Core.CreateDetachedRole.Result {
        return await this.persist(
            this.entities.createRole({
                ...props,
                code: props.code ?? this.nextCode("role"),
                name: props.name ?? "Test Role",
            }),
        );
    }

    public async createPermission(props: Fixtures.Core.CreatePermission.Props): Fixtures.Core.CreatePermission.Result {
        return await this.persist(
            this.entities.createPermission({
                ...props,
                code: props.code ?? this.nextCode("permission"),
                name: props.name ?? "Test Permission",
            }),
        );
    }

    public async createRoleConflictGroup(
        props: Fixtures.Core.CreateRoleConflictGroup.Props,
    ): Fixtures.Core.CreateRoleConflictGroup.Result {
        return await this.persist(
            this.entities.createRoleConflictGroup({
                ...props,
                code: props.code ?? this.nextCode("conflict-group"),
                name: props.name ?? "Test Conflict Group",
            }),
        );
    }

    public async createAuditLog(props: Fixtures.Core.CreateAuditLog.Props = {}): Fixtures.Core.CreateAuditLog.Result {
        const auditLog = this.entities.createAuditLog({
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
        const changeLog = this.entities.createChangeLog({
            delta: props.delta ?? new DeltaChanges({ name: { old: null, new: "Updated Name" } }),
            changeType: props.changeType ?? ChangeSetType.CREATE,
            entityType: props.entityType ?? EntityType.ROLE,
            entity: props.entity ?? randomUUID(),
            auditEntry: auditEntry.id,
        });

        changeLog.sign({ keyVersion: 1, signature: "test-signature" });

        return await this.persist(changeLog);
    }

    public async createAccountRoleAssignment(
        props: Fixtures.Core.CreateAccountRoleAssignment.Props,
    ): Fixtures.Core.CreateAccountRoleAssignment.Result {
        return await this.persist(this.entities.createAccountRoleAssignment(props));
    }

    public async createRolePermissionAssignment(
        props: Fixtures.Core.CreateRolePermissionAssignment.Props,
    ): Fixtures.Core.CreateRolePermissionAssignment.Result {
        return await this.persist(this.entities.createRolePermissionAssignment(props));
    }

    public async createRoleDelegationPolicy(
        props: Fixtures.Core.CreateRoleDelegationPolicy.Props,
    ): Fixtures.Core.CreateRoleDelegationPolicy.Result {
        return await this.persist(this.entities.createRoleDelegationPolicy(props));
    }

    public async createPermissionOverride(
        props: Fixtures.Core.CreatePermissionOverride.Props,
    ): Fixtures.Core.CreatePermissionOverride.Result {
        return await this.persist(this.entities.createPermissionOverride(props));
    }

    public async createRoleConflictMember(
        props: Fixtures.Core.CreateRoleConflictMember.Props,
    ): Fixtures.Core.CreateRoleConflictMember.Result {
        return await this.persist(this.entities.createRoleConflictMember(props));
    }

    public async createRoleClosure(props: Fixtures.Core.CreateRoleClosure.Props): Fixtures.Core.CreateRoleClosure.Result {
        return await this.persist(this.entities.createRoleClosure(props));
    }
}
