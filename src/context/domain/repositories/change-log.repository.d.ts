import { ChangeLog as ChangeLogEntity } from "~common/transaction-manager";

declare global {
    namespace Repositories {
        namespace ChangeLog {
            type Entity = ChangeLogEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.ChangeLog.Types> {}
        }
    }
}
