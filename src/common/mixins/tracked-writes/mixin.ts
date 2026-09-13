import { ChangeSet, ChangeSetType } from "@mikro-orm/postgresql";

import { ExternalChanges } from "~infrastructure/database/utils/external-changes";

export function TrackedWrites<Entity extends ORM.AnyEntity>({
    Entity: EntityClass,
}: Repositories.TrackedWrites.Mixin.Props<Entity>): Repositories.TrackedWrites.Mixin.Result<Entity> {
    return class Mixin implements Repositories.TrackedWrites.Contract<Entity> {
        public async write(props: Repositories.TrackedWrites.Write.Props): Repositories.TrackedWrites.Write.Result<Entity> {
            const { transaction, query, type } = props;
            const rows = await transaction.execute<ORM.EntityDictionary<Entity>[]>(query.sql, [...query.parameters], "all");

            const metadata = transaction.getMetadata(EntityClass);
            const comparator = transaction.getComparator();
            const unitOfWork = transaction.getUnitOfWork();

            const entities: Entity[] = [];
            const changes: ORM.ChangeSet<Entity>[] = [];

            for (const row of rows) {
                const { previous_state: previous, ...columns } = row;
                const entity = transaction.map<Entity>(EntityClass, columns as ORM.EntityDictionary<Entity>);
                const snapshot = comparator.prepareEntity(entity);

                if (type === ChangeSetType.DELETE) {
                    changes.push(Mixin.changeSet({ entity, metadata, type, payload: {}, original: snapshot }));
                    unitOfWork.unsetIdentity(entity);
                } else if (previous) {
                    const previousColumns = previous as ORM.EntityDictionary<Entity>;
                    const original = {
                        ...snapshot,
                        ...transaction.getDriver().mapResult(previousColumns, metadata),
                    };

                    changes.push(
                        Mixin.changeSet({
                            payload: comparator.diffEntities(EntityClass, original, snapshot),
                            type: ChangeSetType.UPDATE,
                            metadata,
                            original,
                            entity,
                        }),
                    );
                } else {
                    changes.push(Mixin.changeSet({ entity, metadata, type, payload: snapshot }));
                }

                entities.push(entity);
            }

            ExternalChanges.record({ entityManager: transaction, changes });

            return entities;
        }

        private static changeSet(
            props: Repositories.TrackedWrites.ChangeSetFactory.Props<Entity>,
        ): Repositories.TrackedWrites.ChangeSetFactory.Result<Entity> {
            const changeSet = new ChangeSet(props.entity, props.type, props.payload, props.metadata);

            changeSet.originalEntity = props.original;

            return changeSet;
        }
    };
}
