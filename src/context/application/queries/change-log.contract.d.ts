declare namespace Queries.ChangeLog {
    interface Contract extends ControllerContract {}

    interface ControllerContract {
        findUnique: FindUnique.Signature;
        findMany: FindMany.Signature;
    }

    namespace FindUnique {
        type Props = {
            log: string;
        };

        type Result = Promise<SystemEntities.ChangeLog>;

        type Signature = (props: Props) => Result;
    }

    namespace FindMany {
        type Props = {
            filters: Repositories.Mappers.ChangeLog.Filters;
            sort: Repositories.Mappers.ChangeLog.Sort;
            pagination: Pagination;
        };

        type Result = Promise<[SystemEntities.ChangeLog[], number]>;

        type Signature = (props: Props) => Result;
    }
}
