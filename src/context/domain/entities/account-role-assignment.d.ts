declare namespace Entities {
    type AccountRoleAssignment = AccountRoleAssignment.Contract;

    namespace AccountRoleAssignment {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt?: Date;
            version: number;

            account: string;
            justification?: string;
            isSystemManaged: boolean;
            isRevoked: boolean;
            isSystemRevoked: boolean;
            expiresAt?: Date;

            realm: Entities.Realm;
            role: Entities.Role;

            restoreBySystem(): void;
            revokeBySystem(): void;
            canAssign(): void;
            canPurge(): void;
            restore(): void;
            revoke(): void;
        }

        type ConstructorProps = {
            isSystemManaged?: boolean;
            realm: Entities.Realm;
            role: Entities.Role;
            isRevoked?: boolean;
            justification?: string;
            expiresAt?: Date;
            account: string;
        };
    }
}
