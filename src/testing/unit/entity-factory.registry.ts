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
    Permission,
    Realm,
    Role,
} from "~context/domain/entities";

export class EntityFactoryRegistry implements Unit.Domain.EntityFactory.Contract {
    public createRealm(props: Unit.Domain.EntityFactory.CreateRealm.Props = {}): Entities.Realm {
        return this.entity(
            new Realm({
                owner: "unit-account",
                code: "realm.unit",
                name: "Unit Realm",
            }),
            props,
        );
    }

    public createRole(props: Unit.Domain.EntityFactory.CreateRole.Props = {}): Entities.Role {
        return this.entity(
            new Role({
                archetype: RoleArchetype.ATOMIC,
                actorType: RoleActorType.HUMAN,
                realm: this.createRealm(),
                code: "role.unit",
                name: "Unit Role",
            }),
            props,
        );
    }

    public createPermission(props: Unit.Domain.EntityFactory.CreatePermission.Props = {}): Entities.Permission {
        return this.entity(
            new Permission({
                realm: this.createRealm(),
                code: "permission.unit",
                name: "Unit Permission",
            }),
            props,
        );
    }

    public createAccountRoleAssignment(
        props: Unit.Domain.EntityFactory.CreateAccountRoleAssignment.Props = {},
    ): Entities.AccountRoleAssignment {
        const realm = this.createRealm();

        return this.entity(
            new AccountRoleAssignment({
                role: this.createRole({ realm }),
                account: "unit-account",
                realm,
            }),
            props,
        );
    }

    public createRolePermissionAssignment(
        props: Unit.Domain.EntityFactory.CreateRolePermissionAssignment.Props = {},
    ): Entities.RolePermissionAssignment {
        const realm = this.createRealm();

        return this.entity(
            new RolePermissionAssignment({
                permission: this.createPermission({ realm }),
                role: this.createRole({ realm }),
                realm,
            }),
            props,
        );
    }

    public createPermissionOverride(
        props: Unit.Domain.EntityFactory.CreatePermissionOverride.Props = {},
    ): Entities.PermissionOverride {
        const realm = this.createRealm();

        return this.entity(
            new PermissionOverride({
                permission: this.createPermission({ realm }),
                effect: PermissionOverrideEffect.ALLOW,
                account: "unit-account",
                realm,
            }),
            props,
        );
    }

    public createRoleDelegationPolicy(
        props: Unit.Domain.EntityFactory.CreateRoleDelegationPolicy.Props = {},
    ): Entities.RoleDelegationPolicy {
        const realm = this.createRealm();

        return this.entity(
            new RoleDelegationPolicy({
                delegator: this.createRole({ code: "role.delegator", realm }),
                target: this.createRole({ code: "role.target", realm }),
                justification: "unit delegation",
                realm,
            }),
            props,
        );
    }

    public createRoleConflictGroup(
        props: Unit.Domain.EntityFactory.CreateRoleConflictGroup.Props = {},
    ): Entities.RoleConflictGroup {
        return this.entity(
            new RoleConflictGroup({
                description: "Unit conflict group",
                realm: this.createRealm(),
                code: "sod.unit",
                name: "Unit SoD",
                maxAllowed: 1,
            }),
            props,
        );
    }

    public createRoleConflictMember(
        props: Unit.Domain.EntityFactory.CreateRoleConflictMember.Props = {},
    ): Entities.RoleConflictMember {
        const realm = this.createRealm();
        const group = this.createRoleConflictGroup({ realm });

        return this.entity(
            new RoleConflictMember({
                role: this.createRole({ realm }),
                group,
            }),
            props,
        );
    }

    public attachRoleConflictMembers(
        props: Unit.Domain.EntityFactory.AttachRoleConflictMembers.Props,
    ): Entities.RoleConflictGroup {
        props.group.members = this.collection({ owner: props.group, items: props.members });
        return props.group;
    }

    public collection<T extends object>(
        props: Unit.Domain.EntityFactory.CollectionFactory.Props<T>,
    ): Unit.Domain.EntityFactory.CollectionFactory.Result<T> {
        return new Collection<T>(props.owner, props.items);
    }

    public createAuditLog(props: Unit.Domain.EntityFactory.CreateAuditLog.Props = {}): SystemEntities.AuditLog {
        return this.entity(
            new AuditLog({
                context: { userAgent: "unit-agent", ip: "127.0.0.1" },
                actionType: "CREATE",
                entityType: "ROLE",
            }),
            props,
        );
    }

    public createChangeLog(props: Unit.Domain.EntityFactory.CreateChangeLog.Props = {}): SystemEntities.ChangeLog {
        return this.entity(
            new ChangeLog({
                delta: { name: { old: "Old Name", new: "New Name" } },
                changeType: ChangeSetType.UPDATE,
                auditEntry: "unit-audit-log",
                entity: "unit-entity",
                entityType: "ROLE",
            }),
            props,
        );
    }

    private entity<Entity extends object>(entity: Entity, props: Partial<Entity>): Entity {
        Object.assign(entity, props);
        return entity;
    }
}
