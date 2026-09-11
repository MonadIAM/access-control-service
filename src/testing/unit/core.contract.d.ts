import { ConfigService } from "@nestjs/config";
import { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Domain {
            type Mock = ReturnType<typeof jest.fn>;

            namespace Core {
                interface Transaction {
                    readonly entityManager: ORM.EntityManager;
                    readonly persist: Mock;
                    readonly remove: Mock;
                    readonly flush: Mock;
                    readonly clear: Mock;
                    readonly merge: Mock;
                }

                interface Contract extends Unit.Domain.RepositoryMockBank.Contract {
                    readonly transaction: TransactionFactory.Signature;
                    readonly config: Config.Signature;
                }

                namespace Service {
                    type Context<TService, TExtensions extends object = Record<never, never>> = {
                        readonly service: TService;
                        readonly repositories: RepositoryMocks.Contract;
                        readonly transaction: Transaction;
                    } & TExtensions;

                    type Signature<TProps, TService, TExtensions extends object = Record<never, never>> = (
                        props?: TProps,
                    ) => Context<TService, TExtensions>;
                }

                namespace TransactionFactory {
                    type Result = Transaction;

                    type Signature = () => Result;
                }

                namespace Config {
                    type Props = {
                        readonly values?: Record<string, unknown>;
                    };

                    type Result = ConfigService;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
