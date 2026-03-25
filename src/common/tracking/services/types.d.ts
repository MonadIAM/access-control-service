import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Tracking {
        namespace Transactional {
            interface Contract {
                run: <T>(props: Run<T>) => Promise<T>;
            }

            type Run<T> = {
                execute: (transaction: EntityManager) => Promise<T>;
                audit?: Entities.AuditLog.ConstructorProps;
                changeLog?: boolean;
            };
        }
    }
}
