declare namespace TransactionManager {
    namespace ChangeLogSubscriber {
        type BuildDelta = {
            originalEntity?: UnknownObject;
            payload: UnknownObject;
            type: ORM.ChangeSetType;
        };
    }
}
