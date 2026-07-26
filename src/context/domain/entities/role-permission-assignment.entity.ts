import { randomUUID } from "node:crypto";

import { AssignmentScope } from "~context/enums";
import { Exception } from "~common/exceptions";

export class RolePermissionAssignment implements Entities.RolePermissionAssignment.Contract {
    private get dictionaryPath(): string {
        return "entities.role-permission-assignment";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public scope: AssignmentScope;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public permission: Entities.Permission;
    public realm: Entities.Realm;
    public role: Entities.Role;

    public constructor(props: Entities.RolePermissionAssignment.ConstructorProps) {
        const now = new Date();
        this.createdAt = now;
        this.id = randomUUID();
        this.scope = AssignmentScope.REALM;

        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.permission = props.permission;
        this.realm = props.realm;
        this.role = props.role;
    }

    public revoke(): void {
        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_REVOKED` });
        } else {
            const now = new Date();
            this.isRevoked = true;
            this.updatedAt = now;
        }
    }

    public restore(): void {
        if (this.isRevoked) {
            const now = new Date();
            this.isRevoked = false;
            this.updatedAt = now;
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_ACTIVE` });
        }
    }

    public canPurge(): void {
        if (!this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_PURGE_ACTIVE` });
        } else if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_PURGE_SYSTEM` });
        }
    }

    public canAssign(): void {
        if (this.role.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_ASSIGN_TO_REVOKED_ROLE` });
        } else if (this.permission.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_ASSIGN_REVOKED_PERMISSION` });
        } else if (this.role.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_ASSIGN_TO_SYSTEM_ROLE` });
        } else if (this.permission.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_ASSIGN_SYSTEM_PERMISSION` });
        }
    }
}
