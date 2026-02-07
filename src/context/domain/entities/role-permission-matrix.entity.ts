import { Ref } from "@mikro-orm/core";

import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class RolePermissionMatrix {
    public id?: string;
    public createdAt?: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public lastActions: DeltaAudit.LastActionsSnapshot;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public permission: Ref<Permission>;
    public realm: Ref<Realm>;
    public role: Ref<Role>;

    public constructor(props: Entities.RolePermissionMatrix.ConstructorProps) {
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.lastActions = props.lastActions;

        this.permission = props.permission;
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
