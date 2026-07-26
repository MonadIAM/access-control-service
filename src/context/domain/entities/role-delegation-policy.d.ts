declare namespace Entities {
    type RoleDelegationPolicy = RoleDelegationPolicy.Contract;

    namespace RoleDelegationPolicy {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt?: Date;
            version: number;

            description?: string;
            depthLimit?: number;
            isSystemManaged: boolean;
            isRevoked: boolean;

            delegator: Entities.Role;
            target: Entities.Role;
            realm: Entities.Realm;

            update(props: ChangeDataProps): void;
            canCreate(): void;
            canPurge(): void;
            restore(): void;
            revoke(): void;
        }

        type MutableFields = Pick<Contract, "depthLimit" | "description">;

        type ConstructorProps = {
            description?: string;
            depthLimit?: number;
            isSystemManaged?: boolean;
            isRevoked?: boolean;
            delegator: Entities.Role;
            target: Entities.Role;
            realm: Entities.Realm;
        };

        type ChangeDataProps = {
            patch: Partial<MutableFields>;
        };
    }
}
