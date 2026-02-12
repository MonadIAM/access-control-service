import { Collection } from "@mikro-orm/core";

import { EntityException } from "~common/exceptions";

import { RoleConflictMember } from "./role-conflict-member.entity";
import { Realm } from "./realm.entity";

export class RoleConflictGroup {
    private readonly dictionaryPath = "entities.role-conflict-group";

    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public code: string;
    public name: string;
    public maxAllowed: number;
    public lastActions: DeltaAudit.LastActionsSnapshot<Entities.RoleConflictGroup.MutableFields>;
    public description?: string;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public realm: Realm;

    public members = new Collection<RoleConflictMember>(this);

    public constructor(props: Entities.RoleConflictGroup.ConstructorProps) {
        this.lastActions = { create: { by: { id: props.actor } } };
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.code = props.code;
        this.name = props.name;
        this.maxAllowed = props.maxAllowed;
        this.description = props.description;

        this.realm = props.realm;
    }

    public changeData({
        reason,
        patch,
        actor,
    }: Entities.RoleConflictGroup.ChangeDataProps): DeltaAudit.Patch<Entities.RoleConflictGroup.MutableFields> {
        const historyPatch: DeltaAudit.Patch<Entities.RoleConflictGroup.MutableFields> = {};

        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && value !== this[key]) {
                (historyPatch[key] as unknown) = { old: this[key], new: value };
                (this[key] as unknown) = value;
            }
        }

        if (Object.keys(historyPatch).length) {
            this.lastActions.update = { at: new Date(), by: { id: actor }, reason, patch: historyPatch };
            return historyPatch;
        } else if (Object.keys(patch).length) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.EMPTY_UPDATE_PATCH`);
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.NO_CHANGES_DETECTED`);
        }
    }

    public revoke({ actor, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.ALREADY_REVOKED`);
        } else {
            this.isRevoked = true;
            this.lastActions.revoke = { at: new Date(), by: { id: actor }, reason };
        }
    }

    public restore({ actor, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            this.isRevoked = false;
            this.lastActions.restore = { at: new Date(), by: { id: actor }, reason };
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
