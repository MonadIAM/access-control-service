export class MaskedValue implements ValueObjects.MaskedValue.Contract {
    public value: string;
    public hash: string;

    public constructor(props: ValueObjects.MaskedValue.ConstructorProps) {
        this.value = props.value;
        this.hash = props.hash;
    }
}
