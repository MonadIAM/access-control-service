declare namespace Queries {
    namespace AuditLog {
        interface Contract {
            findUnique(props: FindUnique.Props): FindUnique.Result;
            findMany(props: FindMany.Props): FindMany.Result;
        }

        namespace FindUnique {
            type Props = {
                log: string;
            };

            type Result = Promise<Entities.AuditLog>;
        }

        namespace FindMany {
            type Props = {
                filters: Adapters.AuditLog.Filters;
                sort: Adapters.AuditLog.Sort;
                pagination: Pagination;
            };

            type Result = Promise<[Entities.AuditLog[], number]>;
        }
    }
}
