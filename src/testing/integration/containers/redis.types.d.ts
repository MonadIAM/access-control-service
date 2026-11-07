import Redis from "ioredis";

declare global {
    namespace Integration.Redis.Suite {
        interface Contract {
            executor: ExecutorAccessor.Signature;
            client: ClientAccessor.Signature;
        }

        namespace ExecutorAccessor {
            type Result = InfrastructureServices.ScriptExecutor.Contract;

            type Signature = () => Result;
        }

        namespace ClientAccessor {
            type Result = Redis;

            type Signature = () => Result;
        }
    }
}
