import { describe, it, expect } from "@jest/globals";

import { RoleClosure } from "./role-closure.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

describe("[Entity] - RoleClosure", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns all fields", () => {
            // Arrange
            const ancestor = {} as Role;
            const descendant = {} as Role;
            const realm = {} as Realm;

            // Act
            const closure = new RoleClosure({ depth: 3, ancestor, descendant, realm });

            // Assert
            expect(closure.depth).toBe(3);
            expect(closure.ancestor).toBe(ancestor);
            expect(closure.descendant).toBe(descendant);
            expect(closure.realm).toBe(realm);
        });
    });
});
