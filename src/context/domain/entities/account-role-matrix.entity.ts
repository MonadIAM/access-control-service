import { Ref } from "@mikro-orm/core";

import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class AccountRoleMatrix {
    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public constructor(
        public accountId: string,

        public realm: Ref<Realm>,
        public role: Ref<Role>,

        public lastActions: DeltaAudit.LastActionsSnapshot<AccountRoleMatrix>,

        public isSystemManaged: boolean = false,
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
