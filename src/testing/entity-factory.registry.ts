import { ChangeSetType, Collection } from "@mikro-orm/core";

import { PermissionOverrideEffect, RoleActorType, RoleArchetype } from "~context/enums";
import { AuditLog, ChangeLog } from "~common/transaction-manager/entities";
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

export class EntityFactoryRegistry implements Testing.EntityFactory.Contract {
    public createRealm(props: Testing.EntityFactory.CreateRealm.Props = {}): Entities.Realm {
        return this.entity(
            new Realm({
                ...props,
                owner: props.owner ?? "unit-account",
                code: props.code ?? "realm.unit",
                name: props.name ?? "Unit Realm",
            }),
            props,
        );
    }

    public createRole(props: Testing.EntityFactory.CreateRole.Props = {}): Entities.Role {
        return this.entity(
            new Role({
                ...props,
                archetype: props.archetype ?? RoleArchetype.ATOMIC,
                actorType: props.actorType ?? RoleActorType.HUMAN,
                realm: props.realm ?? this.createRealm(),
                code: props.code ?? "role.unit",
                name: props.name ?? "Unit Role",
            }),
            props,
        );
    }

    public createPermission(props: Testing.EntityFactory.CreatePermission.Props = {}): Entities.Permission {
        return this.entity(
            new Permission({
                ...props,
                realm: props.realm ?? this.createRealm(),
                code: props.code ?? "permission.unit",
                name: props.name ?? "Unit Permission",
            }),
            props,
        );
    }

    public createAccountRoleAssignment(
        props: Testing.EntityFactory.CreateAccountRoleAssignment.Props = {},
    ): Entities.AccountRoleAssignment {
        const { expiresAt, ...state } = props;
        const realm = props.realm ?? props.role?.realm ?? this.createRealm();

        return this.entity(
            new AccountRoleAssignment({
                ...state,
                expiresAt,
                role: props.role ?? this.createRole({ realm }),
                account: props.account ?? "unit-account",
                realm,
            }),
            state,
        );
    }

    public createRolePermissionAssignment(
        props: Testing.EntityFactory.CreateRolePermissionAssignment.Props = {},
    ): Entities.RolePermissionAssignment {
        const realm = props.realm ?? props.role?.realm ?? props.permission?.realm ?? this.createRealm();

        return this.entity(
            new RolePermissionAssignment({
                ...props,
                permission: props.permission ?? this.createPermission({ realm }),
                role: props.role ?? this.createRole({ realm }),
                realm,
            }),
            props,
        );
    }

    public createPermissionOverride(
        props: Testing.EntityFactory.CreatePermissionOverride.Props = {},
    ): Entities.PermissionOverride {
        const { expiresAt, ...state } = props;
        const realm = props.realm ?? props.permission?.realm ?? this.createRealm();

        return this.entity(
            new PermissionOverride({
                ...state,
                expiresAt,
                permission: props.permission ?? this.createPermission({ realm }),
                effect: props.effect ?? PermissionOverrideEffect.ALLOW,
                account: props.account ?? "unit-account",
                realm,
            }),
            state,
        );
    }

    public createRoleDelegationPolicy(
        props: Testing.EntityFactory.CreateRoleDelegationPolicy.Props = {},
    ): Entities.RoleDelegationPolicy {
        const { expiresAt, ...state } = props;
        const realm = props.realm ?? props.delegator?.realm ?? props.target?.realm ?? this.createRealm();

        return this.entity(
            new RoleDelegationPolicy({
                ...state,
                expiresAt,
                delegator: props.delegator ?? this.createRole({ code: "role.delegator", realm }),
                target: props.target ?? this.createRole({ code: "role.target", realm }),
                realm,
            }),
            state,
        );
    }

    public createRoleConflictGroup(
        props: Testing.EntityFactory.CreateRoleConflictGroup.Props = {},
    ): Entities.RoleConflictGroup {
        return this.entity(
            new RoleConflictGroup({
                ...props,
                realm: props.realm ?? this.createRealm(),
                code: props.code ?? "sod.unit",
                name: props.name ?? "Unit SoD",
                maxAllowed: props.maxAllowed ?? 1,
            }),
            props,
        );
    }

    public createRoleConflictMember(
        props: Testing.EntityFactory.CreateRoleConflictMember.Props = {},
    ): Entities.RoleConflictMember {
        const realm = props.group?.realm ?? props.role?.realm ?? this.createRealm();
        const group = props.group ?? this.createRoleConflictGroup({ realm });

        return this.entity(
            new RoleConflictMember({
                ...props,
                role: props.role ?? this.createRole({ realm }),
                group,
            }),
            props,
        );
    }

    public createRoleClosure(props: Testing.EntityFactory.CreateRoleClosure.Props): Entities.RoleClosure {
        return new RoleClosure(props);
    }

    public attachRoleConflictMembers(
        props: Testing.EntityFactory.AttachRoleConflictMembers.Props,
    ): Entities.RoleConflictGroup {
        props.group.members = this.collection({ owner: props.group, items: props.members });
        return props.group;
    }

    public collection<T extends object>(
        props: Testing.EntityFactory.CollectionFactory.Props<T>,
    ): Testing.EntityFactory.CollectionFactory.Result<T> {
        return new Collection<T>(props.owner, props.items);
    }

    public createAuditLog(props: Testing.EntityFactory.CreateAuditLog.Props = {}): SystemEntities.AuditLog {
        const { context, ...state } = props;

        return this.entity(
            new AuditLog({
                ...state,
                context: { userAgent: context?.userAgent ?? "unit-agent", ip: context?.ip ?? "127.0.0.1" },
                actionType: props.actionType ?? "CREATE",
                entityType: props.entityType ?? "ROLE",
            }),
            state,
        );
    }

    public createChangeLog(props: Testing.EntityFactory.CreateChangeLog.Props = {}): SystemEntities.ChangeLog {
        return this.entity(
            new ChangeLog({
                ...props,
                delta: props.delta ?? { name: { old: "Old Name", new: "New Name" } },
                changeType: props.changeType ?? ChangeSetType.UPDATE,
                auditEntry: props.auditEntry ?? "unit-audit-log",
                entity: props.entity ?? "unit-entity",
                entityType: props.entityType ?? "ROLE",
            }),
            props,
        );
    }

    private entity<Entity extends object>(entity: Entity, props: Partial<Entity>): Entity {
        Object.assign(entity, props);
        return entity;
    }
}
