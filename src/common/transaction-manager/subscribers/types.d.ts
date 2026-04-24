import { ChangeSetType } from "@mikro-orm/postgresql";

declare global {
    namespace TransactionManager {
        namespace ChangeLogSubscriber {
            type BuildDelta = {
                originalEntity?: UnknownObject;
                payload: UnknownObject;
                type: ChangeSetType;
            };
        }
    }
}
