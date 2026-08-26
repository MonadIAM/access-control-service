declare namespace Services {
    namespace ChangeLog {
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

            type Result = Promise<SystemEntities.ChangeLog[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
