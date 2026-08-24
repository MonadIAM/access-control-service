export class DeltaChanges implements ValueObjects.DeltaChanges.Contract {
    [field: string]: { old: unknown; new: unknown };

    public constructor(props: ValueObjects.DeltaChanges.ConstructorProps) {
        for (const [field, change] of Object.entries(props)) {
            this[field] = change;
        }
    }
}
