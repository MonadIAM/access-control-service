import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";

import { KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Service {
            interface Contract {
                run: <T extends AnyEntity | AnyEntity[]>(props: Run<T>) => Promise<T>;
            }

            type ProjectionJournalEntry<T> = {
                operationType: string;
                payloadMapper: (result: T) => UnknownObject | UnknownObject[];
            };

            type Run<T extends AnyEntity | AnyEntity[]> =
                | {
                      execute: (transaction: EntityManager) => Promise<T> | T;
                      audit?: Entities.AuditLog.ConstructorProps;
                      outbox?: {
                          payloadMapper?: (result: T) => AnyEntity | AnyEntity[];
                          destinationTopic: KafkaTopic;
                          metadata?: UnknownObject;
                          actionType: string;
                      };
                      projectionJournal?: ProjectionJournalEntry<T> | ProjectionJournalEntry<T>[];
                      changeLog?: boolean;
                      resource?: string;
                  }
                | {
                      execute: (transaction: EntityManager) => Promise<void> | void;
                      audit?: Entities.AuditLog.ConstructorProps;
                      projectionJournal?: never;
                      changeLog?: never;
                      resource?: string;
                      outbox?: never;
                  };
        }
    }
}
