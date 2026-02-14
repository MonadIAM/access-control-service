import { Collection } from "@mikro-orm/core";

import { RoleActorType, RoleProtoType } from "~context/enums";
import { EntityException } from "~common/exceptions";

import { RoleDelegationPolicy } from "./role-delegation-policy.entity";
import { RolePermissionMatrix } from "./role-permission-matrix.entity";
import { RoleConflictMember } from "./role-conflict-member.entity";
import { AccountRoleMatrix } from "./account-role-matrix.entity";
import { Realm } from "./realm.entity";

export class Role {
    private readonly dictionaryPath = "entities.role";

    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public code: string;
    public name: string;
    public actorType: RoleActorType;
    public protoType: RoleProtoType;
    public lastActions: DeltaAudit.LastActionsSnapshot<Entities.Role.MutableFields>;
    public description?: string;
    public isSystemManaged: boolean;
    public nonDelegable: boolean;
    public isRevoked: boolean;

    public realm: Realm;

    public delegationPoliciesAsDelegator = new Collection<RoleDelegationPolicy>(this);
    public delegationPoliciesAsTarget = new Collection<RoleDelegationPolicy>(this);
    public conflictMemberships = new Collection<RoleConflictMember>(this);
    public permissionMatrix = new Collection<RolePermissionMatrix>(this);
    public accountMatrix = new Collection<AccountRoleMatrix>(this);

    public constructor(props: Entities.Role.ConstructorProps) {
        this.lastActions = { create: { by: { id: props.actor } } };
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.nonDelegable = props.nonDelegable ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.code = props.code;
        this.name = props.name;
        this.actorType = props.actorType;
        this.protoType = props.protoType;
        this.description = props.description;

        this.realm = props.realm;
    }

    public changeMetadata({
        reason,
        patch,
        actor,
    }: Entities.Role.ChangeDataProps): DeltaAudit.Patch<Entities.Role.MutableFields> {
        const historyPatch: DeltaAudit.Patch<Entities.Role.MutableFields> = {};
        const now = new Date();
        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && value !== this[key]) {
                (historyPatch[key] as unknown) = { old: this[key], new: value };
                (this[key] as unknown) = value;
            }
        }

        if (Object.keys(historyPatch).length) {
            this.lastActions.update = { at: now, by: { id: actor }, reason, patch: historyPatch };
            this.updatedAt = now;
            return historyPatch;
        } else if (Object.keys(patch).length) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.NO_CHANGES_DETECTED`);
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.EMPTY_UPDATE_PATCH`);
        }
    }

    public revoke({ actor, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.ALREADY_REVOKED`);
        } else {
            const now = new Date();
            this.isRevoked = true;
            this.lastActions.revoke = { at: now, by: { id: actor }, reason };
            this.updatedAt = now;
        }
    }

    public restore({ actor, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            const now = new Date();
            this.isRevoked = false;
            this.lastActions.restore = { at: now, by: { id: actor }, reason };
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
