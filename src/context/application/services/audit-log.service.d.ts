declare namespace Services {
    namespace AuditLog {
        interface Contract {
            purgeExpired(props: PurgeExpired.Props): PurgeExpired.Result;
        }

        namespace PurgeExpired {
            type Props = {
                transaction: ORM.EntityManager;
                expirationDate: Date;
                batchSize: number;
            };

            type Result = Promise<SystemEntities.AuditLog[]>;
        }
    }
}
