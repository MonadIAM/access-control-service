import { MikroORM } from "@mikro-orm/postgresql";

declare global {
    namespace Integration.Postgres {
        namespace Resource {
            interface Contract {
                orm: MikroORM;

                reset: Reset.Signature;
                close: Close.Signature;
            }

            namespace Connection {
                interface Props {
                    database: string;
                    username: string;
                    password: string;
                    host: string;
                    port: number;
                }
            }

            namespace Start {
                type Result = Promise<Contract>;

                type Signature = () => Result;
            }

            namespace Connect {
                type Result = Promise<Contract>;

                type Signature = () => Result;
            }

            namespace Reset {
                type Result = Promise<void>;

                type Signature = () => Result;
            }

            namespace Close {
                type Result = Promise<void>;

                type Signature = () => Result;
            }
        }

        namespace Suite {
            interface Setup<Repository, Fixture> {
                repository: RepositoryFactory<Repository>;
                fixture: FixtureFactory<Fixture>;
            }

            interface FactoryContext {
                writeManager: ORM.EntityManager;
                readManager: ORM.EntityManager;
                orm: MikroORM;
            }

            interface Contract<Repository, Fixture> {
                repository: RepositoryAccessor.Signature<Repository>;
                fixtures: FixtureAccessor.Signature<Fixture>;
                transaction: Transaction.Signature;
            }

            type FixtureFactory<Fixture> = (entityManager: ORM.EntityManager) => Fixture;
            type RepositoryFactory<Repository> = (context: FactoryContext) => Repository;

            namespace RepositoryAccessor {
                type Result<Repository> = Repository;

                type Signature<Repository> = () => Result<Repository>;
            }

            namespace FixtureAccessor {
                type Result<Fixture> = Fixture;

                type Signature<Fixture> = () => Result<Fixture>;
            }

            namespace Transaction {
                type Callback<Result> = (transaction: ORM.EntityManager) => Promise<Result>;

                type Result<Value> = Promise<Value>;

                type Signature = <Result>(callback: Callback<Result>) => Promise<Result>;
            }
        }

        namespace Helpers {
            interface Contract {
                getRoleClosurePathKeys: GetRoleClosurePathKeys.Signature;
            }

            type RoleClosurePathRow = {
                ancestor_id: string;
                descendant_id: string;
                depth: number;
            };

            namespace GetRoleClosurePathKeys {
                type Props = {
                    transaction: ORM.EntityManager;
                    realm: string;
                };

                type Result = Promise<string[]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
