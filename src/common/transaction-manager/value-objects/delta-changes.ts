export class DeltaChanges implements ValueObjects.DeltaChanges.Contract {
    readonly [field: string]: {
        readonly old: unknown;
        readonly new: unknown;
    };

    public constructor(props: ValueObjects.DeltaChanges.ConstructorProps) {
        for (const [field, change] of Object.entries(props)) {
            Object.defineProperty(this, field, {
                value: Object.deepFreeze({ old: change.old, new: change.new }),
                configurable: false,
                enumerable: true,
                writable: false,
            });
        }

        Object.freeze(this);
    }
}
