import { Collection } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { RoleActorType, RoleArchetype } from "~context/enums";
import { Exception } from "~common/exceptions";

export class Role implements Entities.Role.Contract {
    private static readonly dictionaryPath = "entities.role";

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public code: string;
    public name: string;
    public actorType: RoleActorType;
    public archetype: RoleArchetype;
    public description?: string;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public realm: Entities.Realm;

    public delegationPoliciesAsDelegator = new Collection<Entities.RoleDelegationPolicy>(this);
    public delegationPoliciesAsTarget = new Collection<Entities.RoleDelegationPolicy>(this);
    public permissionAssignments = new Collection<Entities.RolePermissionAssignment>(this);
    public conflictMemberships = new Collection<Entities.RoleConflictMember>(this);
    public accountAssignment = new Collection<Entities.AccountRoleAssignment>(this);

    public constructor(props: Entities.Role.ConstructorProps) {
        const now = new Date();
        this.createdAt = now;
        this.id = randomUUID();

        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.code = props.code;
        this.name = props.name;
        this.actorType = props.actorType;
        this.archetype = props.archetype;
        this.description = props.description;

        this.realm = props.realm;
    }

    public update({ patch }: Entities.Role.ChangeDataProps): void {
        const now = new Date();
        let affected = 0;
        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && value !== this[key]) {
                (this[key] as unknown) = value;
                ++affected;
            }
        }

        if (affected) {
            this.updatedAt = now;
        } else if (Object.keys(patch).length) {
            throw Exception.invariantViolation({ messageKey: `${Role.dictionaryPath}.NO_CHANGES_DETECTED` });
        } else {
            throw Exception.invariantViolation({ messageKey: `${Role.dictionaryPath}.EMPTY_UPDATE_PATCH` });
        }
    }

    public revoke(): void {
        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${Role.dictionaryPath}.ALREADY_REVOKED` });
        } else {
            const now = new Date();
            this.isRevoked = true;
            this.updatedAt = now;
        }
    }

    public restore(): void {
        if (this.isRevoked) {
            const now = new Date();
            this.isRevoked = false;
            this.updatedAt = now;
        } else {
            throw Exception.invariantViolation({ messageKey: `${Role.dictionaryPath}.ALREADY_ACTIVE` });
        }
    }

    public canPurge(): void {
        if (!this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${Role.dictionaryPath}.CANNOT_PURGE_ACTIVE` });
        } else if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${Role.dictionaryPath}.CANNOT_PURGE_SYSTEM` });
        }
    }
}
