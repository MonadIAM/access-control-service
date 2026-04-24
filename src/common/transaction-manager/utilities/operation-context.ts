import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OperationContext {
    private readonly storage = new AsyncLocalStorage<TransactionManager.OperationContextData>();

    public run<T>(data: TransactionManager.OperationContextData, fn: () => T): T {
        return this.storage.run(data, fn);
    }

    public get(): Optional<TransactionManager.OperationContextData> {
        return this.storage.getStore();
    }
}
