import { randomUUID } from "node:crypto";
import Redis from "ioredis";

import { RoleIntegrationHelpers } from "~testing/integration/domain-service/role.helpers";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

import { MaterializeProjectionFixture } from "./materialize.fixture";

export class RoleProjectionFixture extends CoreFixture implements Fixtures.Projection.Role.Contract {
    public constructor(
        entityManager: ORM.EntityManager,
        private readonly redis: Redis,
    ) {
        super(entityManager);
    }

    public async createTree(): Fixtures.Projection.Role.CreateTree.Result {
        const tree = await new RoleIntegrationHelpers().createDeepRoleTree({ fixtures: this, code: "role-projection" });
        await this.snapshot();
        return tree;
    }

    public async revoke(roles: Entities.Role[]): Promise<void> {
        for (const role of roles) {
            role.isRevoked = true;
        }
        await this.entityManager.flush();
        await this.snapshot();
    }

    public async moveScenario(): Fixtures.Projection.Role.MoveScenario.Result {
        const tree = await this.createTree();
        const account = randomUUID();
        const previous = await this.createPermission({ realm: tree.realm, code: "move.previous" });
        const next = await this.createPermission({ realm: tree.realm, code: "move.next" });
        await this.createAccountRoleAssignment({ realm: tree.realm, role: tree.roles.child, account });
        await this.createRolePermissionAssignment({ realm: tree.realm, role: tree.roles.parent, permission: previous });
        await this.createRolePermissionAssignment({ realm: tree.realm, role: tree.roles.detached, permission: next });
        await this.snapshot();
        return { tree, account, previous, next };
    }

    public async purgeSubtreeScenario(
        props: Fixtures.Projection.Role.PurgeSubtreeScenario.Props,
    ): Fixtures.Projection.Role.PurgeSubtreeScenario.Result {
        const tree = await this.createTree();
        const { parent, child, grandchild, detached } = tree.roles;
        const accounts = Array.from({ length: props.accounts }, () => randomUUID());
        const permission = await this.createPermission({ realm: tree.realm });
        const foreign = await this.createRealm({ code: "foreign-projection" });
        const foreignRole = await this.createRole({ realm: foreign, code: "foreign-role" });
        for await (const role of [parent, child, grandchild, detached]) {
            for await (const account of accounts) {
                await this.createAccountRoleAssignment({ realm: tree.realm, role, account });
            }
            await this.createRolePermissionAssignment({ realm: tree.realm, role, permission });
        }
        await this.snapshot();
        return { tree, permission, foreignRole, foreign, accounts };
    }

    private async snapshot(): Promise<void> {
        await new MaterializeProjectionFixture(this.entityManager).snapshot(this.redis);
    }
}
