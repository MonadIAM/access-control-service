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

            realm: Entities.Realm;
            role: Entities.Role;

            canPurge(): void;
            restore(): void;
            revoke(): void;
            canAssign(): void;
        }

        type ConstructorProps = {
            account: string;
            isSystemManaged?: boolean;
            isRevoked?: boolean;
            realm: Entities.Realm;
            role: Entities.Role;
        };
    }
}
