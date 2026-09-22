declare namespace Fixtures.RoleClosure {
    interface Contract extends Fixtures.Core.Contract {
        decreaseDepthScenario: DecreaseDepthScenario.Signature;
        moveSubtreesScenario: MoveSubtreesScenario.Signature;
        insertScenario: InsertScenario.Signature;
        moveScenario: MoveScenario.Signature;
    }

    namespace InsertScenario {
        type Result = Promise<{
            expectedPathKeys: string[];
            descendant: Entities.Role;
            ancestor: Entities.Role;
            realm: Entities.Realm;
        }>;

        type Signature = () => Result;
    }

    namespace DecreaseDepthScenario {
        type Result = Promise<{
            expectedPathKeys: string[];
            realm: Entities.Realm;
            role: Entities.Role;
        }>;

        type Signature = () => Result;
    }

    namespace MoveSubtreesScenario {
        type Result = Promise<{
            expectedUpsertedPathKeys: string[];
            expectedRemovedPathKeys: string[];
            expectedPathKeys: string[];
            children: Entities.Role[];
            newParent: Entities.Role;
            oldParent: Entities.Role;
            realm: Entities.Realm;
        }>;

        type Signature = () => Result;
    }

    namespace MoveScenario {
        type Result = Promise<{
            expectedUpsertedPathKeys: string[];
            expectedRemovedPathKeys: string[];
            targetChild: Entities.Role;
            expectedPathKeys: string[];
            initialPathKeys: string[];
            newParent: Entities.Role;
            oldParent: Entities.Role;
            realm: Entities.Realm;
            target: Entities.Role;
        }>;

        type Signature = () => Result;
    }
}
