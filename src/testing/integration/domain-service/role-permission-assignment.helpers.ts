import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { ConfigService } from "@nestjs/config";

import { RolePermissionAssignmentRepository } from "~context/infrastructure/repositories/role-permission-assignment.repository";
import { RolePermissionAssignmentService } from "~context/domain/services/role-permission-assignment.service";
import { PermissionRepository } from "~context/infrastructure/repositories/permission.repository";
import { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import { RoleRepository } from "~context/infrastructure/repositories/role.repository";
import { EntityFactoryRegistry } from "~testing/entity-factory.registry";

export class RolePermissionAssignmentIntegrationHelpers implements Integration.Domain.RolePermissionAssignment.Contract {
    private readonly entities = new EntityFactoryRegistry();

    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.RolePermissionAssignment.Config.Props = {},
    ): Integration.Domain.RolePermissionAssignment.Service.Context {
        const repositories = this.repositories(context, props);

        return {
            rolePermissionAssignmentService: new RolePermissionAssignmentService(
                repositories.rolePermissionAssignments,
                repositories.permissions,
                repositories.realms,
                repositories.roles,
            ),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.RolePermissionAssignment.Config.Props = {},
    ): Integration.Domain.RolePermissionAssignment.Repositories.Context {
        const config = this.config(props);

        return {
            rolePermissionAssignments: new RolePermissionAssignmentRepository(context.readManager, config),
            permissions: new PermissionRepository(context.readManager, config),
            realms: new RealmRepository(context.readManager, config),
            roles: new RoleRepository(context.readManager, config),
        };
    }

    public async seedSystemRealm(
        suite: Integration.Domain.RolePermissionAssignment.Suite,
    ): Integration.Domain.RolePermissionAssignment.SeedSystemRealm.Result {
        return await suite.transaction(async (transaction) => {
            const realm = this.entities.createRealm({
                id: SYSTEM_REALM_ID,
                owner: SYSTEM_REALM_ID,
                code: "system",
                name: "System",
            });

            transaction.persist(realm);
            await transaction.flush();

            return realm;
        });
    }

    private config(props: Integration.Domain.RolePermissionAssignment.Config.Props): ConfigService {
        return new ConfigService({
            PERMISSION_PER_ROLE_LIMIT: props.permissionLimit ?? 3,
            PERMISSION_PER_REALM_LIMIT: 3,
            ROLE_PER_REALM_LIMIT: 3,
            REALM_LIMIT: 3,
        });
    }
}
