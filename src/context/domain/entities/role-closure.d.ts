declare namespace Entities {
    type RoleClosure = RoleClosure.Contract;

    namespace RoleClosure {
        interface Contract {
            depth: number;

            descendant: Entities.Role;
            ancestor: Entities.Role;
            realm: Entities.Realm;
        }

        type ConstructorProps = {
            depth: number;
            descendant: Entities.Role;
            ancestor: Entities.Role;
            realm: Entities.Realm;
        };
    }
}
