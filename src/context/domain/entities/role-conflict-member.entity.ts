import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";

export class RoleConflictMember implements Entities.RoleConflictMember.Contract {
    private get dictionaryPath(): string {
        return "entities.role-conflict-member";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public group: Entities.RoleConflictGroup;
    public role: Entities.Role;

    public constructor(props: Entities.RoleConflictMember.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.group = props.group;
        this.role = props.role;
    }

    public canPurge(): void {
        this.group.canModifyMembers();

        if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_PURGE_SYSTEM` });
        }
    }
}
