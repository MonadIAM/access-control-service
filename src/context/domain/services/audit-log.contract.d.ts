declare namespace Services {
    namespace AuditLog {
        interface Contract extends ProcessorContract {}

        interface ProcessorContract {
            purgeExpired: PurgeExpired.Signature;
        }

        namespace PurgeExpired {
            type Props = {
                transaction: ORM.EntityManager;
                expirationDate: Date;
                batchSize: number;
            };

            type Result = Promise<SystemEntities.AuditLog[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
