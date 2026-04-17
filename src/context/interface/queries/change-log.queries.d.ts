declare namespace Queries {
    namespace ChangeLog {
        type Entity = Repositories.ChangeLog.Entity;

        interface Contract {
            findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
            findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
        }

        namespace FindUnique {
            type Props = {
                log: string;
            };

            type Result = Entity;
        }

        namespace FindMany {
            type Props = {
                filters: Adapters.ChangeLog.Filters;
                sort: Adapters.ChangeLog.Sort;
                pagination: Pagination;
            };

            type Result = [Entity[], number];
        }
    }
}
