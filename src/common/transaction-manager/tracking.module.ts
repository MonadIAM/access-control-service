import { Module } from "@nestjs/common";

import { TRANSACTION_MANAGER_SERVICES } from "./services";
import { ChangeLogSubscriber } from "./subscribers";
import { OperationContext } from "./utilities";

@Module({
    providers: [...TRANSACTION_MANAGER_SERVICES, ChangeLogSubscriber, OperationContext],
    exports: [...TRANSACTION_MANAGER_SERVICES, ChangeLogSubscriber],
})
export class TransactionManagerModule {}
