import { Collection, Ref } from "@mikro-orm/core";

import { RoleConflictMember } from "./role-conflict-member.entity";
import { Realm } from "./realm.entity";

export class RoleConflictGroup {
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

    public realm: Ref<Realm>;

    public members = new Collection<RoleConflictMember>(this);

    public constructor(props: Entities.RoleConflictGroup.ConstructorProps) {
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.code = props.code;
        this.name = props.name;
        this.maxAllowed = props.maxAllowed;
        this.lastActions = props.lastActions;
        this.description = props.description;

        this.realm = props.realm;
    }

    public changeData({ reason, patch, actor, now }: Entities.RoleConflictGroup.ChangeDataProps): void {
        const historyPatch: DeltaAudit.Patch<Entities.RoleConflictGroup.MutableFields> = {};

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
