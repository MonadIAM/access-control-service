import { ChangeSetType } from "@mikro-orm/postgresql";

declare global {
    namespace Tracking {
        namespace ChangeLogSubscriber {
            type BuildDelta = {
                originalEntity?: UnknownObject;
                payload: UnknownObject;
                type: ChangeSetType;
            };
        }
    }
}
