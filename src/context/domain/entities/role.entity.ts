import { Collection } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { RoleActorType, RolePrototype } from "~context/enums";
import { EntityException } from "~common/exceptions";

import { RolePermissionAssignment } from "./role-permission-assignment.entity";
import { AccountRoleAssignment } from "./account-role-assignment.entity";
import { RoleDelegationPolicy } from "./role-delegation-policy.entity";
import { RoleConflictMember } from "./role-conflict-member.entity";
import { Realm } from "./realm.entity";

export class Role {
    private get dictionaryPath(): string {
        return "entities.role";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public code: string;
    public name: string;
    public actorType: RoleActorType;
    public prototype: RolePrototype;
    public description?: string;
    public isSystemManaged: boolean;
    public nonDelegable: boolean;
    public isRevoked: boolean;

    public realm: Realm;

    public delegationPoliciesAsDelegator = new Collection<RoleDelegationPolicy>(this);
    public delegationPoliciesAsTarget = new Collection<RoleDelegationPolicy>(this);
    public permissionAssignments = new Collection<RolePermissionAssignment>(this);
    public conflictMemberships = new Collection<RoleConflictMember>(this);
    public accountAssignment = new Collection<AccountRoleAssignment>(this);

    public constructor(props: Entities.Role.ConstructorProps) {
        const now = new Date();
        this.createdAt = now;
        this.id = randomUUID();

        this.isSystemManaged = props.isSystemManaged ?? false;
        this.nonDelegable = props.nonDelegable ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.code = props.code;
        this.name = props.name;
        this.actorType = props.actorType;
        this.prototype = props.prototype;
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
            throw EntityException.invariantViolation(`${this.dictionaryPath}.NO_CHANGES_DETECTED`);
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.EMPTY_UPDATE_PATCH`);
        }
    }

    public revoke(): void {
        if (this.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.ALREADY_REVOKED`);
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
            throw EntityException.invariantViolation(`${this.dictionaryPath}.ALREADY_ACTIVE`);
        }
    }

    public canPurge(): void {
        if (!this.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_PURGE_ACTIVE`);
        } else if (this.isSystemManaged) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_PURGE_SYSTEM`);
        }
    }
}
