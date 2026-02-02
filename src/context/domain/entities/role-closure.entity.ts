import { Ref } from "@mikro-orm/core";

import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class RoleClosure {
    public constructor(
        public realm: Ref<Realm>,
        public ancestor: Ref<Role>,
        public descendant: Ref<Role>,
        public depth: number,
    ) {}
}
