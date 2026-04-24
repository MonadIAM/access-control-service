import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";

import { AggregateType, EventType, OutboxTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Service {
            interface Contract {
                run: <T extends AnyEntity | AnyEntity[]>(props: Run<T>) => Promise<T>;
            }

            type Run<T extends AnyEntity | AnyEntity[]> =
                | {
                      execute: (transaction: EntityManager) => Promise<T> | T;
                      audit?: Entities.AuditLog.ConstructorProps;
                      outbox?: {
                          payloadMapper?: (result: T) => AnyEntity | AnyEntity[];
                          destinationTopic: OutboxTopic;
                          aggregateType: AggregateType;
                          eventType: EventType;
                          metadata?: UnknownObject;
                          ttlExpiresAt?: Date;
                      };
                      changeLog?: boolean;
                      resource?: string;
                  }
                | {
                      execute: (transaction: EntityManager) => Promise<void> | void;
                      audit?: Entities.AuditLog.ConstructorProps;
                      changeLog?: never;
                      resource?: string;
                      outbox?: never;
                  };
        }
    }
}
