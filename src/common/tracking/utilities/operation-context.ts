import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OperationContext {
    private readonly storage = new AsyncLocalStorage<Tracking.OperationContextData>();

    public run<T>(data: Tracking.OperationContextData, fn: () => T): T {
        return this.storage.run(data, fn);
    }

    public get(): Optional<Tracking.OperationContextData> {
        return this.storage.getStore();
    }
}
