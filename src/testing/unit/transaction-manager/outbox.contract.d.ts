import type { OutboxService } from "~common/transaction-manager/services/outbox.service";

declare global {
    namespace Unit {
        namespace TransactionManager {
            namespace Outbox {
                interface Contract extends Unit.Domain.Core.Contract {
                    readonly schemaRegistry: SchemaRegistryFactory.Signature;
                    readonly service: Service.Signature;
                }

                namespace SchemaRegistryFactory {
                    type Props = {
                        readonly validate?: Kafka.SchemaRegistry.Validate.Signature;
                    };

                    type Result = {
                        readonly service: Kafka.SchemaRegistry.Contract;
                        readonly validate: Unit.Domain.Mock;
                    };

                    type Signature = (props?: Props) => Result;
                }

                namespace Service {
                    type Props = {
                        readonly registry?: SchemaRegistryFactory.Result;
                    };

                    type Result = {
                        readonly registry: SchemaRegistryFactory.Result;
                        readonly service: OutboxService;
                    };

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
