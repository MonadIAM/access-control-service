import { describe, it, expect } from "@jest/globals";

import { RoleClosure } from "./role-closure.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

describe("RoleClosure Entity", () => {
    describe("constructor", () => {
        it("should assign all fields", () => {
            const ancestor = {} as Role;
            const descendant = {} as Role;
            const realm = {} as Realm;

            const closure = new RoleClosure({ depth: 3, ancestor, descendant, realm });

            expect(closure.depth).toBe(3);
            expect(closure.ancestor).toBe(ancestor);
            expect(closure.descendant).toBe(descendant);
            expect(closure.realm).toBe(realm);
        });
    });
});
