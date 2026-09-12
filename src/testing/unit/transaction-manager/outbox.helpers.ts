import { jest } from "@jest/globals";

import { OutboxService } from "~common/transaction-manager/services/outbox.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class OutboxUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.TransactionManager.Outbox.Contract {
    public schemaRegistry(
        props: Unit.TransactionManager.Outbox.SchemaRegistryFactory.Props = {},
    ): Unit.TransactionManager.Outbox.SchemaRegistryFactory.Result {
        const validate = jest.fn(props.validate ?? (() => undefined));

        return {
            service: this.contract<Kafka.SchemaRegistry.Contract>({
                decode: jest.fn(),
                encode: jest.fn(),
                validate,
            }),
            validate,
        };
    }

    public service(
        props: Unit.TransactionManager.Outbox.Service.Props = {},
    ): Unit.TransactionManager.Outbox.Service.Result {
        const registry = props.registry ?? this.schemaRegistry();
        const service = new OutboxService(
            registry.service,
            this.config({ values: { SERVICE_NAME: "access-control-service" } }),
        );

        return { service, registry };
    }
}
