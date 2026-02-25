import { randomUUID } from "node:crypto";

import { EntityException } from "~common/exceptions";
import { AssignmentScope } from "~context/enums";

import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class RolePermissionAssignment {
    private get dictionaryPath(): string {
        return "entities.role-permission-assignment";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public scope: AssignmentScope;
    public lastActions: DeltaAudit.LastActionsSnapshot;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public permission: Permission;
    public realm: Realm;
    public role: Role;

    public constructor(props: Entities.RolePermissionAssignment.ConstructorProps) {
        this.scope = AssignmentScope.REALM;
        this.createdAt = new Date();
        this.id = randomUUID();

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
            const now = new Date();
            this.isRevoked = true;
            this.lastActions.revoke = { at: now, by: { id: actor }, reason };
            this.updatedAt = now;
        }
    }

    public restore({ actor, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            const now = new Date();
            this.isRevoked = false;
            this.lastActions.restore = { at: now, by: { id: actor }, reason };
            this.updatedAt = now;
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

    public canAssign(): void {
        if (this.role.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_ASSIGN_TO_REVOKED_ROLE`);
        } else if (this.permission.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_ASSIGN_REVOKED_PERMISSION`);
        } else if (this.role.isSystemManaged) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_ASSIGN_TO_SYSTEM_ROLE`);
        } else if (this.permission.isSystemManaged) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_ASSIGN_SYSTEM_PERMISSION`);
        }
    }
}
