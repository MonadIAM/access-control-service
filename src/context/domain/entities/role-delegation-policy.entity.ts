import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class RoleDelegationPolicy {
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
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.lastActions = props.lastActions;
        this.description = props.description;
        this.depthLimit = props.depthLimit;

        this.delegator = props.delegator;
        this.target = props.target;
        this.realm = props.realm;
    }

    public changeData({ reason, patch, actor, now }: Entities.RoleDelegationPolicy.ChangeDataProps): void {
        const historyPatch: DeltaAudit.Patch<Entities.RoleDelegationPolicy.MutableFields> = {};

        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && value !== this[key]) {
                (historyPatch[key] as unknown) = { old: this[key], new: value };
                (this[key] as unknown) = value;
            }
        }

        if (Object.keys(historyPatch).length) {
            this.lastActions.update = { at: now, by: { id: actor }, reason, patch: historyPatch };
            this.version += 1;
        }
    }

    public revoke({ actor, now, reason }: Entities.BaseMethodProps): void {
        if (!this.isRevoked) {
            this.isRevoked = true;
            this.lastActions.revoke = { at: now, by: { id: actor }, reason };
            this.version += 1;
        }
    }

    public restore({ actor, now, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            this.isRevoked = false;
            this.lastActions.restore = { at: now, by: { id: actor }, reason };
            this.version += 1;
        }
    }
}
