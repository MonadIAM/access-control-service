import { Ref } from "@mikro-orm/core";

import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class RoleClosure {
    public depth: number;

    public descendant: Ref<Role>;
    public ancestor: Ref<Role>;
    public realm: Ref<Realm>;

    public constructor(props: Entities.RoleClosure.ConstructorProps) {
        this.depth = props.depth;

        this.descendant = props.descendant;
        this.ancestor = props.ancestor;
        this.realm = props.realm;
    }
}
