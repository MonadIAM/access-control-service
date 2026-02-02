import { Collection, Ref } from "@mikro-orm/core";

import { RolePermissionMatrix } from "./role-permission-matrix.entity";
import { PermissionOverride } from "./permission-override.entity";
import { Realm } from "./realm.entity";

export class Permission {
    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public roleMatrix = new Collection<RolePermissionMatrix>(this);
    public accountOverrides = new Collection<PermissionOverride>(this);

    public constructor(
        public code: string,
        public name: string,

        public realm: Ref<Realm>,

        public lastActions: DeltaAudit.LastActionsSnapshot<Entities.Permission.MutableFields>,

        public description?: string,

        public isSystemManaged: boolean = false,
        public isRevoked: boolean = false,
    ) {}

    public changeData({ reason, patch, actor, now }: Entities.Permission.ChangeDataProps): void {
        const historyPatch: DeltaAudit.Patch<Entities.Permission.MutableFields> = {};

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
