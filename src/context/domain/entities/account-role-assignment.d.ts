declare namespace Entities {
    type AccountRoleAssignment = AccountRoleAssignment.Contract;

    namespace AccountRoleAssignment {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt?: Date;
            version: number;

            account: string;
            isSystemManaged: boolean;
            isRevoked: boolean;
            expiresAt?: Date;

            realm: Entities.Realm;
            role: Entities.Role;

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
            expiresAt?: Date;
            account: string;
        };
    }
}
