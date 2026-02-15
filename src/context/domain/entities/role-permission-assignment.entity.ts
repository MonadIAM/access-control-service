import { EntityException } from "~common/exceptions";

import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class RolePermissionAssignment {
    private readonly dictionaryPath = "entities.role-permission-assignment";

    public id?: string;
    public createdAt?: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public lastActions: DeltaAudit.LastActionsSnapshot;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public permission: Permission;
    public realm: Realm;
    public role: Role;

    public constructor(props: Entities.RolePermissionAssignment.ConstructorProps) {
        this.lastActions = { create: { by: { id: props.actor } } };
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.permission = props.permission;
        this.realm = props.realm;
        this.role = props.role;
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
