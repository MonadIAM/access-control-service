import { ConfigService } from "@nestjs/config";

declare global {
    namespace Unit.Domain.Core {
        interface Transaction {
            entityManager: ORM.EntityManager;
            persist: Jest.Mock<(entity: object) => void>;
            remove: Jest.Mock;
            flush: Jest.Mock;
            clear: Jest.Mock;
            merge: Jest.Mock;
        }

        interface Contract extends Unit.Domain.RepositoryMockBank.Contract {
            transaction: TransactionFactory.Signature;
            config: Config.Signature;
        }

        namespace Service {
            type Context<TService, TExtensions extends object = Record<never, never>> = {
                repositories: RepositoryMocks.Contract;
                transaction: Transaction;
                service: TService;
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
                values?: Record<string, unknown>;
            };

            type Result = ConfigService;

            type Signature = (props?: Props) => Result;
        }
    }
}
