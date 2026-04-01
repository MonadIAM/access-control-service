declare namespace Queries {
    namespace AuditLog {
        type Entity = Repositories.AuditLog.Entity;

        interface Contract {
            findMany: (props: FindMany) => Promise<[Entity[], number]>;
            findUnique: (props: FindUnique) => Promise<Entity>;
        }

        type FindMany = {
            filters: Repositories.AuditLog.Filters;
            sort: Repositories.AuditLog.Sort;
            pagination: Pagination;
        };

        type FindUnique = {
            log: string;
        };
    }
}
