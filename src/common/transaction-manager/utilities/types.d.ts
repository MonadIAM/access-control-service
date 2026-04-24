declare namespace TransactionManager {
    type OperationContextData = {
        changeLogEnabled: boolean;
        auditEntry: string;
    };
}
