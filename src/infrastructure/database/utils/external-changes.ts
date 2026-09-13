const registry = new WeakMap<ORM.FlushEventArgs["em"], ORM.ChangeSet<ORM.AnyEntity>[]>();

export class ExternalChanges {
    public static record<Entity extends ORM.AnyEntity>(
        props: ORM.ExternalChanges.Record.Props<Entity>,
    ): ORM.ExternalChanges.Record.Result {
        const recorded = registry.get(props.entityManager) ?? [];

        recorded.push(...(props.changes as unknown as ORM.ChangeSet<ORM.AnyEntity>[]));
        registry.set(props.entityManager, recorded);
    }

    public static drain(props: ORM.ExternalChanges.Drain.Props): ORM.ExternalChanges.Drain.Result {
        const recorded = registry.get(props.entityManager) ?? [];

        registry.delete(props.entityManager);

        return recorded;
    }
}
