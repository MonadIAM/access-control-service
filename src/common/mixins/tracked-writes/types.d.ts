import { CompiledQuery } from "kysely";

declare global {
    namespace Repositories {
        namespace TrackedWrites {
            namespace Mixin {
                type Props<Entity extends ORM.AnyEntity> = {
                    Entity: ORM.EntityClass<Entity>;
                };

                type Result<Entity extends ORM.AnyEntity> = Class<Contract<Entity>>;
            }

            interface Contract<Entity extends ORM.AnyEntity> {
                write(props: Write.Props): Write.Result<Entity>;
            }

            namespace ChangeSetFactory {
                type Props<Entity extends ORM.AnyEntity> = {
                    payload: ORM.EntityDictionary<Entity>;
                    original?: ORM.EntityData<Entity>;
                    metadata: ORM.EntityMetadata<Entity>;
                    type: ORM.ChangeSetType;
                    entity: Entity;
                };

                type Result<Entity extends ORM.AnyEntity> = ORM.ChangeSet<Entity>;

                type Signature = <Entity extends ORM.AnyEntity>(props: Props<Entity>) => Result<Entity>;
            }

            namespace Write {
                type Props = {
                    type: ORM.ChangeSetType;
                    transaction: ORM.EntityManager;
                    query: CompiledQuery;
                };

                type Result<Entity extends ORM.AnyEntity> = Promise<Entity[]>;

                type Signature = <Entity extends ORM.AnyEntity>(props: Props) => Result<Entity>;
            }
        }
    }
}
