import { EntityManager } from "@mikro-orm/postgresql";

import { RoleConflictGroup as RoleConflictGroupEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RoleConflictGroup {
            type Entity = RoleConflictGroupEntity;

            interface InternalContract extends Repositories.Base.Contract<Entity, Adapters.Realm.Types> {
                hasAccountViolatingConflictGroup: (props: HasAccountViolatingConflictGroup) => Promise<boolean>;
                wouldExceedGroupLimit: (props: WouldExceedGroupLimit) => Promise<boolean>;
                findViolationDetails: (props: FindViolationDetails) => Promise<Entity[]>;
                hasViolations: (props: HasViolations) => Promise<boolean>;
            }

            interface ExternalContract
                extends Pick<InternalContract, "findViolationDetails" | "findUniqueOrThrow" | "findMany"> {}

            type FindViolationDetails = {
                account: string;
                roles: string[];
                realm: string;
            };

            type HasViolations = {
                transaction?: EntityManager;
                account: string;
                roles: string[];
                realm: string;
            };

            type GetViolationsQuery = {
                transaction?: EntityManager;
                account: string;
                roles: string[];
                realm: string;
            };

            type HasAccountViolatingConflictGroup = {
                transaction?: EntityManager;
                identifiers: string[];
                maxAllowed: number;
            };

            type WouldExceedGroupLimit = {
                transaction?: EntityManager;
                count?: number;
                realm: string;
            };
        }
    }
}
