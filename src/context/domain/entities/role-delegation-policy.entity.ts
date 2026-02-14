import { EntityException } from "~common/exceptions";

import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class RoleDelegationPolicy {
    private readonly dictionaryPath = "entities.role-delegation-policy";

    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version = 1;

    public lastActions: DeltaAudit.LastActionsSnapshot<Entities.RoleDelegationPolicy.MutableFields>;
    public description?: string;
    public depthLimit?: number;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public delegator: Role;
    public target: Role;
    public realm: Realm;

    public constructor(props: Entities.RoleDelegationPolicy.ConstructorProps) {
        this.lastActions = { create: { by: { id: props.actor } } };
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.description = props.description;
        this.depthLimit = props.depthLimit;

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
            throw EntityException.invariantViolation(`${this.dictionaryPath}.NO_CHANGES_DETECTED`);
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.EMPTY_UPDATE_PATCH`);
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
