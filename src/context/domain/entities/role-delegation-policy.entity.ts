import { Ref } from "@mikro-orm/core";

import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class RoleDelegationPolicy {
    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version = 1;

    public constructor(
        public realm: Ref<Realm>,
        public target: Ref<Role>,
        public delegator: Ref<Role>,
        public depthLimit: number,

        public lastActions: DeltaAudit.LastActionsSnapshot<Entities.RoleDelegationPolicy.MutableFields>,

        public description?: string,

        public isSystemManaged: boolean = false,
        public isRevoked: boolean = false,
    ) {}

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
