export class RoleClosure implements Entities.RoleClosure.Contract {
    public depth: number;

    public descendant: Entities.Role;
    public ancestor: Entities.Role;
    public realm: Entities.Realm;

    public constructor(props: Entities.RoleClosure.ConstructorProps) {
        this.depth = props.depth;

        this.descendant = props.descendant;
        this.ancestor = props.ancestor;
        this.realm = props.realm;
    }
}
