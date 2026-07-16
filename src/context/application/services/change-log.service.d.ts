import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace ChangeLog {
            interface Contract {
                purgeExpired(props: PurgeExpired.Props): PurgeExpired.Result;
            }

            namespace PurgeExpired {
                type Props = {
                    transaction: EntityManager;
                    expirationDate: Date;
                    batchSize: number;
                };

                type Result = Promise<Entities.ChangeLog[]>;
            }
        }
    }
}
