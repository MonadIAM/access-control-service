import { randomUUID } from "node:crypto";

import { EntityException } from "~common/exceptions";

import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class RoleDelegationPolicy {
    private get dictionaryPath(): string {
        return "entities.role-delegation-policy";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public lastActions: DeltaAudit.LastActionsSnapshot<Entities.RoleDelegationPolicy.MutableFields>;
    public description?: string;
    public depthLimit?: number;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public delegator: Role;
    public target: Role;
    public realm: Realm;

    public constructor(props: Entities.RoleDelegationPolicy.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.lastActions = { create: { by: { id: props.actor } } };
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;
        this.depthLimit = props.depthLimit ?? 0;

        this.description = props.description;

        this.delegator = props.delegator;
        this.target = props.target;
        this.realm = props.realm;
    }

    public changeData({
        reason,
        patch,
        actor,
    }: Entities.RoleDelegationPolicy.ChangeDataProps): DeltaAudit.Patch<Entities.RoleDelegationPolicy.MutableFields> {
        const historyPatch: DeltaAudit.Patch<Entities.RoleDelegationPolicy.MutableFields> = {};
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
