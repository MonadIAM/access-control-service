import { ConfigService } from "@nestjs/config";

import { RoleClosureRepository } from "~context/infrastructure/repositories/role-closure.repository";
import { TransactionalHelper } from "~testing/integration/transaction-manager/transactional.helpers";
import { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import { RoleRepository } from "~context/infrastructure/repositories/role.repository";
import { RoleService } from "~context/domain/services/role.service";
import { RoleArchetype } from "~context/enums";

export class RoleIntegrationHelpers implements Integration.Domain.Role.Contract {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.Role.Config.Props = {},
    ): Integration.Domain.Role.Service.Context {
        const repositories = this.repositories(context, props);
        const transactional = new TransactionalHelper().createTransactionalServiceContext({ orm: context.orm });
        const config = this.config(props);

        return {
            roleService: new RoleService(repositories.roleClosures, repositories.realms, repositories.roles, config),
            transactional,
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.Role.Config.Props = {},
    ): Integration.Domain.Role.Repositories.Context {
        const config = this.config(props);

        return {
            roleClosures: new RoleClosureRepository(),
            realms: new RealmRepository(context.readManager, config),
            roles: new RoleRepository(context.readManager, config),
        };
    }

    public async createHierarchy(
        props: Integration.Domain.Role.CreateHierarchy.Props,
    ): Integration.Domain.Role.CreateHierarchy.Result {
        await props.fixtures.createRoleClosure({
            descendant: props.descendant,
            ancestor: props.ancestor,
            realm: props.realm,
            depth: props.depth,
        });
    }

    public async createDeepRoleTree(
        props: Integration.Domain.Role.CreateDeepRoleTree.Props,
    ): Integration.Domain.Role.CreateDeepRoleTree.Result {
        const realm = await props.fixtures.createRealm({ code: props.code });
        const root = await props.fixtures.createRole({
            archetype: RoleArchetype.COMPOSITE,
            code: "roles.root",
            name: "Root",
            realm,
        });
        const parent = await props.fixtures.createRole({
            archetype: RoleArchetype.COMPOSITE,
            code: "roles.parent",
            name: "Parent",
            realm,
        });
        const child = await props.fixtures.createRole({
            archetype: RoleArchetype.COMPOSITE,
            code: "roles.child",
            name: "Child",
            realm,
        });
        const grandchild = await props.fixtures.createRole({ code: "roles.grandchild", name: "Grandchild", realm });
        const detached = await props.fixtures.createRole({
            archetype: RoleArchetype.COMPOSITE,
            code: "roles.detached",
            name: "Detached",
            realm,
        });

        await this.createHierarchy({ fixtures: props.fixtures, realm, ancestor: root, descendant: parent, depth: 1 });
        await this.createHierarchy({ fixtures: props.fixtures, realm, ancestor: parent, descendant: child, depth: 1 });
        await this.createHierarchy({ fixtures: props.fixtures, realm, ancestor: child, descendant: grandchild, depth: 1 });
        await this.createHierarchy({ fixtures: props.fixtures, realm, ancestor: root, descendant: child, depth: 2 });
        await this.createHierarchy({ fixtures: props.fixtures, realm, ancestor: parent, descendant: grandchild, depth: 2 });
        await this.createHierarchy({ fixtures: props.fixtures, realm, ancestor: root, descendant: grandchild, depth: 3 });
        await this.createHierarchy({ fixtures: props.fixtures, realm, ancestor: root, descendant: detached, depth: 1 });

        return {
            roles: {
                grandchild,
                detached,
                parent,
                child,
                root,
            },
            realm,
        };
    }

    private config(props: Integration.Domain.Role.Config.Props): ConfigService {
        return new ConfigService({
            MAX_ROLE_SUBTREE_SIZE_FOR_PURGE: props.subtreeSizeLimit ?? 3,
            ROLE_PER_REALM_LIMIT: props.roleLimit ?? 10,
            REALM_LIMIT: 3,
        });
    }
}
