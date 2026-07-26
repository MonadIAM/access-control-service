declare namespace Queries {
    namespace ChangeLog {
        interface Contract {
            findUnique(props: FindUnique.Props): FindUnique.Result;
            findMany(props: FindMany.Props): FindMany.Result;
        }

        namespace FindUnique {
            type Props = {
                log: string;
            };

            type Result = Promise<SystemEntities.ChangeLog>;
        }

        namespace FindMany {
            type Props = {
                filters: Adapters.ChangeLog.Filters;
                sort: Adapters.ChangeLog.Sort;
                pagination: Pagination;
            };

            type Result = Promise<[SystemEntities.ChangeLog[], number]>;
        }
    }
}
