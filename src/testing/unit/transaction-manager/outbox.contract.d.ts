declare namespace Unit.TransactionManager.Outbox {
    interface Contract extends Unit.Domain.Core.Contract {
        schemaRegistry: SchemaRegistryFactory.Signature;
        service: Service.Signature;
    }

    namespace SchemaRegistryFactory {
        type Props = {
            validate?: Kafka.SchemaRegistry.Validate.Signature;
        };

        type Result = {
            service: Kafka.SchemaRegistry.Contract;
            validate: Jest.Mock<Kafka.SchemaRegistry.Validate.Signature>;
        };

        type Signature = (props?: Props) => Result;
    }

    namespace Service {
        type Props = {
            registry?: SchemaRegistryFactory.Result;
        };

        type Result = {
            service: globalThis.TransactionManager.Outbox.Contract;
            registry: SchemaRegistryFactory.Result;
        };

        type Signature = (props?: Props) => Result;
    }
}
