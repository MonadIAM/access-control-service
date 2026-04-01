declare namespace Queries {
    namespace ChangeLog {
        type Entity = Repositories.ChangeLog.Entity;

        interface Contract {
            findMany: (props: FindMany) => Promise<[Entity[], number]>;
            findUnique: (props: FindUnique) => Promise<Entity>;
        }

        type FindMany = {
            filters: Repositories.ChangeLog.Filters;
            sort: Repositories.ChangeLog.Sort;
            pagination: Pagination;
        };

        type FindUnique = {
            log: string;
        };
    }
}
