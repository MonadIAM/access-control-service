import { Ref } from "@mikro-orm/core";

import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class AccountRoleMatrix {
    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public accountId: string;
    public lastActions: DeltaAudit.LastActionsSnapshot;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public realm: Ref<Realm>;
    public role: Ref<Role>;

    public constructor(props: Entities.AccountRoleMatrix.ConstructorProps) {
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.accountId = props.accountId;
        this.lastActions = props.lastActions;

        this.realm = props.realm;
        this.role = props.role;
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
