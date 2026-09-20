import { RealmType } from "~context/enums";

declare global {
    namespace Entities {
        type Realm = Realm.Contract;

        namespace Realm {
            interface Contract {
                id: string;
                createdAt: Date;
                updatedAt?: Date;
                version: number;

                type: RealmType;
                code: string;
                name: string;
                owner: string;
                description?: string;

                isSystemManaged: boolean;
                isRevoked: boolean;
                isSystemRevoked: boolean;

                update(props: ChangeDataProps): void;
                restoreBySystem(): void;
                revokeBySystem(): void;
                canPurge(): void;
                restore(): void;
                revoke(): void;
            }

            type MutableFields = Pick<Contract, "name" | "description">;

            type ConstructorProps = {
                type?: RealmType;
                id?: string;
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
}
