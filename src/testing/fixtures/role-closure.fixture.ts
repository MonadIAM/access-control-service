import { CoreFixture } from "./core.fixture";

export class RoleClosureFixture extends CoreFixture implements Fixtures.RoleClosure.Contract {
    /**
     * Builds an existing parent chain before inserting inherited closure paths for a new descendant.
     */
    public async insertScenario(): Fixtures.RoleClosure.InsertScenario.Result {
        const realm = await this.createRealm({ code: "closure-insert", name: "Closure Insert" });
        const rootRole = await this.createRole({ realm, code: "roles.root", name: "Root Role" });
        const parentRole = await this.createRole({ realm, code: "roles.parent", name: "Parent Role" });
        const detachedRole = await this.createDetachedRole({ realm, code: "roles.detached", name: "Detached Role" });

        await this.createRoleClosure({ realm, ancestor: rootRole, descendant: parentRole, depth: 1 });

        return {
            expectedPathKeys: [
                `${detachedRole.id}:${detachedRole.id}:0`,
                `${parentRole.id}:${detachedRole.id}:1`,
                `${parentRole.id}:${parentRole.id}:0`,
                `${rootRole.id}:${detachedRole.id}:2`,
                `${rootRole.id}:${parentRole.id}:1`,
                `${rootRole.id}:${rootRole.id}:0`,
            ],
            descendant: detachedRole,
            ancestor: parentRole,
            realm,
        };
    }

    /**
     * Builds two child subtrees under one parent to verify bulk subtree reparenting.
     */
    public async moveSubtreesScenario(): Fixtures.RoleClosure.MoveSubtreesScenario.Result {
        const realm = await this.createRealm({ code: "closure-move-subtrees", name: "Closure Move Subtrees" });
        const oldParent = await this.createRole({ realm, code: "roles.old-parent", name: "Old Parent Role" });
        const newParent = await this.createRole({ realm, code: "roles.new-parent", name: "New Parent Role" });
        const firstChild = await this.createRole({ realm, code: "roles.first-child", name: "First Child Role" });
        const secondChild = await this.createRole({ realm, code: "roles.second-child", name: "Second Child Role" });
        const grandchild = await this.createRole({ realm, code: "roles.grandchild", name: "Grandchild Role" });

        await this.createRoleClosure({ realm, ancestor: oldParent, descendant: firstChild, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: oldParent, descendant: secondChild, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: firstChild, descendant: grandchild, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: oldParent, descendant: grandchild, depth: 2 });

        return {
            expectedUpsertedPathKeys: [
                `${newParent.id}:${firstChild.id}:1`,
                `${newParent.id}:${grandchild.id}:2`,
                `${newParent.id}:${secondChild.id}:1`,
            ],
            expectedRemovedPathKeys: [
                `${oldParent.id}:${firstChild.id}`,
                `${oldParent.id}:${grandchild.id}`,
                `${oldParent.id}:${secondChild.id}`,
            ],
            expectedPathKeys: [
                `${firstChild.id}:${firstChild.id}:0`,
                `${firstChild.id}:${grandchild.id}:1`,
                `${grandchild.id}:${grandchild.id}:0`,
                `${newParent.id}:${firstChild.id}:1`,
                `${newParent.id}:${grandchild.id}:2`,
                `${newParent.id}:${newParent.id}:0`,
                `${newParent.id}:${secondChild.id}:1`,
                `${oldParent.id}:${oldParent.id}:0`,
                `${secondChild.id}:${secondChild.id}:0`,
            ],
            children: [firstChild, secondChild],
            newParent,
            oldParent,
            realm,
        };
    }

    /**
     * Builds a three-level chain to verify only bypass paths have their depth decreased.
     */
    public async decreaseDepthScenario(): Fixtures.RoleClosure.DecreaseDepthScenario.Result {
        const realm = await this.createRealm({ code: "closure-decrease-depth", name: "Closure Decrease Depth" });
        const rootRole = await this.createRole({ realm, code: "roles.root", name: "Root Role" });
        const removedRole = await this.createRole({ realm, code: "roles.removed", name: "Removed Role" });
        const childRole = await this.createRole({ realm, code: "roles.child", name: "Child Role" });

        await this.createRoleClosure({ realm, ancestor: rootRole, descendant: removedRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: removedRole, descendant: childRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: rootRole, descendant: childRole, depth: 2 });

        return {
            expectedPathKeys: [
                `${childRole.id}:${childRole.id}:0`,
                `${removedRole.id}:${childRole.id}:1`,
                `${removedRole.id}:${removedRole.id}:0`,
                `${rootRole.id}:${childRole.id}:1`,
                `${rootRole.id}:${removedRole.id}:1`,
                `${rootRole.id}:${rootRole.id}:0`,
            ],
            role: removedRole,
            realm,
        };
    }

    /**
     * Builds a subtree with old and new parents to verify removed and upserted closure paths after a move.
     */
    public async moveScenario(): Fixtures.RoleClosure.MoveScenario.Result {
        const realm = await this.createRealm({ code: "closure-move", name: "Closure Move" });
        const oldParent = await this.createRole({ realm, code: "roles.old-parent", name: "Old Parent Role" });
        const newParent = await this.createRole({ realm, code: "roles.new-parent", name: "New Parent Role" });
        const targetRole = await this.createRole({ realm, code: "roles.target", name: "Target Role" });
        const targetChild = await this.createRole({ realm, code: "roles.target-child", name: "Target Child Role" });

        await this.createRoleClosure({ realm, ancestor: oldParent, descendant: targetRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: targetRole, descendant: targetChild, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: oldParent, descendant: targetChild, depth: 2 });

        return {
            expectedUpsertedPathKeys: [`${newParent.id}:${targetChild.id}:2`, `${newParent.id}:${targetRole.id}:1`],
            expectedRemovedPathKeys: [`${oldParent.id}:${targetChild.id}`, `${oldParent.id}:${targetRole.id}`],
            expectedPathKeys: [
                `${newParent.id}:${newParent.id}:0`,
                `${newParent.id}:${targetChild.id}:2`,
                `${newParent.id}:${targetRole.id}:1`,
                `${oldParent.id}:${oldParent.id}:0`,
                `${targetChild.id}:${targetChild.id}:0`,
                `${targetRole.id}:${targetChild.id}:1`,
                `${targetRole.id}:${targetRole.id}:0`,
            ],
            initialPathKeys: [
                `${newParent.id}:${newParent.id}:0`,
                `${oldParent.id}:${oldParent.id}:0`,
                `${oldParent.id}:${targetChild.id}:2`,
                `${oldParent.id}:${targetRole.id}:1`,
                `${targetChild.id}:${targetChild.id}:0`,
                `${targetRole.id}:${targetChild.id}:1`,
                `${targetRole.id}:${targetRole.id}:0`,
            ],
            target: targetRole,
            targetChild,
            newParent,
            oldParent,
            realm,
        };
    }
}
