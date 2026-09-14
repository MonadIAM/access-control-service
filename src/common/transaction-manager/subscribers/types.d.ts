declare namespace TransactionManager {
    namespace ChangeLogSubscriber {
        type BuildDelta = {
            originalEntity?: UnknownObject;
            type: ORM.ChangeSetType;
            payload: UnknownObject;
            entity?: UnknownObject;
        };
    }
}
