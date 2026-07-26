declare namespace Entities {
    type RoleConflictMember = RoleConflictMember.Contract;

    namespace RoleConflictMember {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt?: Date;
            version: number;

            isSystemManaged: boolean;
            isRevoked: boolean;

            group: Entities.RoleConflictGroup;
            role: Entities.Role;

            canPurge(): void;
        }

        type ConstructorProps = {
            isSystemManaged?: boolean;
            isRevoked?: boolean;
            group: Entities.RoleConflictGroup;
            role: Entities.Role;
        };
    }
}
