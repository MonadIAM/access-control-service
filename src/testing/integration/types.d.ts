import { MikroORM } from "@mikro-orm/postgresql";

declare global {
    namespace Integration {
        namespace Postgres {
            namespace Resource {
                interface Contract {
                    readonly orm: MikroORM;

                    reset: Reset.Signature;
                    close: Close.Signature;
                }

                namespace Connection {
                    interface Props {
                        readonly database: string;
                        readonly username: string;
                        readonly password: string;
                        readonly host: string;
                        readonly port: number;
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
                    readonly repository: RepositoryFactory<Repository>;
                    readonly fixture: FixtureFactory<Fixture>;
                }

                interface FactoryContext {
                    readonly writeManager: ORM.EntityManager;
                    readonly readManager: ORM.EntityManager;
                    readonly orm: MikroORM;
                }

                interface Contract<Repository, Fixture> {
                    readonly repository: RepositoryAccessor.Signature<Repository>;
                    readonly fixtures: FixtureAccessor.Signature<Fixture>;
                    readonly transaction: Transaction.Signature;
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
                    readonly getRoleClosurePathKeys: GetRoleClosurePathKeys.Signature;
                }

                type RoleClosurePathRow = {
                    readonly ancestor_id: string;
                    readonly descendant_id: string;
                    readonly depth: number;
                };

                namespace GetRoleClosurePathKeys {
                    type Props = {
                        readonly transaction: ORM.EntityManager;
                        readonly realm: string;
                    };

                    type Result = Promise<string[]>;

                    type Signature = (props: Props) => Result;
                }
            }
        }
    }
}
