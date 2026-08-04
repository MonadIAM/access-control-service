declare namespace Queries {
    namespace ChangeLog {
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
                filters: Adapters.ChangeLog.Filters;
                sort: Adapters.ChangeLog.Sort;
                pagination: Pagination;
            };

            type Result = Promise<[SystemEntities.ChangeLog[], number]>;

            type Signature = (props: Props) => Result;
        }
    }
}
