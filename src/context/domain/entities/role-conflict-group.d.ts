declare namespace Entities {
    type RoleConflictGroup = RoleConflictGroup.Contract;

    namespace RoleConflictGroup {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt?: Date;
            version: number;

            code: string;
            name: string;
            maxAllowed: number;
            description?: string;
            isSystemManaged: boolean;
            isRevoked: boolean;

            realm: Entities.Realm;

            members: ORM.Collection<Entities.RoleConflictMember>;

            update(props: ChangeDataProps): void;
            canModifyMembers(): void;
            canPurge(): void;
            restore(): void;
            revoke(): void;
        }

        type MutableFields = Pick<Contract, "name" | "description" | "maxAllowed">;

        type ConstructorProps = {
            code: string;
            name: string;
            maxAllowed: number;
            description?: string;
            isSystemManaged?: boolean;
            isRevoked?: boolean;
            realm: Entities.Realm;
        };

        type ChangeDataProps = {
            patch: Partial<MutableFields>;
        };
    }
}
