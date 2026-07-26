declare namespace Entities {
    type Realm = Realm.Contract;

    namespace Realm {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt?: Date;
            version: number;

            code: string;
            name: string;
            owner: string;
            description?: string;

            isSystemManaged: boolean;
            isRevoked: boolean;

            update(props: ChangeDataProps): void;
            canPurge(): void;
            restore(): void;
            revoke(): void;
        }

        type MutableFields = Pick<Contract, "name" | "description">;

        type ConstructorProps = {
            owner: string;
            code: string;
            name: string;
            description?: string;
            isSystemManaged?: boolean;
            isRevoked?: boolean;
        };

        type ChangeDataProps = {
            patch: Partial<MutableFields>;
        };
    }
}
