import { Ref } from "@mikro-orm/core";

import { PermissionOverrideEffect } from "~context/enums";

import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";

export class PermissionOverride {
    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public constructor(
        public accountId: string,

        public realm: Ref<Realm>,
        public permission: Ref<Permission>,

        public effect: PermissionOverrideEffect,

        public lastActions: DeltaAudit.LastActionsSnapshot<PermissionOverride>,

        public isRevoked: boolean = false,
    ) {}

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
