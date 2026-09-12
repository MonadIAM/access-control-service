export class MaskedValue implements ValueObjects.MaskedValue.Contract {
    public readonly value: string;
    public readonly hash: string;

    public constructor(props: ValueObjects.MaskedValue.ConstructorProps) {
        this.value = props.value;
        this.hash = props.hash;

        Object.freeze(this);
    }
}
