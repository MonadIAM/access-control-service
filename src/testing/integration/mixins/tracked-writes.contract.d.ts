import type { CompiledQuery } from "kysely";

declare global {
    namespace Integration.TrackedWritesHelper {
        interface Contract {
            increaseDepthQuery: IncreaseDepthQuery.Signature;
            upsertPathsQuery: UpsertPathsQuery.Signature;
            deletePathsQuery: DeletePathsQuery.Signature;
            insertPathQuery: InsertPathQuery.Signature;
        }

        type Path = {
            descendant: string;
            ancestor: string;
            realm: string;
            depth: number;
        };

        namespace InsertPathQuery {
            type Props = Path;

            type Result = CompiledQuery;

            type Signature = (props: Props) => Result;
        }

        namespace DeletePathsQuery {
            type Props = {
                realm: string;
            };

            type Result = CompiledQuery;

            type Signature = (props: Props) => Result;
        }

        namespace IncreaseDepthQuery {
            type Props = {
                realm: string;
            };

            type Result = CompiledQuery;

            type Signature = (props: Props) => Result;
        }

        namespace UpsertPathsQuery {
            type Props = {
                paths: Path[];
            };

            type Result = CompiledQuery;

            type Signature = (props: Props) => Result;
        }
    }
}
