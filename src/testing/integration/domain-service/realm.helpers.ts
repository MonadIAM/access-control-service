import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { ConfigService } from "@nestjs/config";

import { AccountRoleAssignmentRepository } from "~context/infrastructure/repositories/account-role-assignment.repository";
import { PermissionOverrideRepository } from "~context/infrastructure/repositories/permission-override.repository";
import { PermissionRepository } from "~context/infrastructure/repositories/permission.repository";
import { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import { RoleRepository } from "~context/infrastructure/repositories/role.repository";
import { ADMIN_PERMISSION_CODES } from "~infrastructure/datasets/bootstrap";
import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
import { RealmService } from "~context/domain/services/realm.service";

export class RealmIntegrationHelpers implements Integration.Domain.Realm.Contract {
    private readonly entities = new EntityFactoryRegistry();

    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.Realm.Config.Props = {},
    ): Integration.Domain.Realm.Service.Context {
        const repositories = this.repositories(context, props);

        return {
            realmService: new RealmService(
                repositories.permissions,
                repositories.realms,
                repositories.accountRoleAssignments,
                repositories.permissionOverrides,
                repositories.roles,
            ),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.Realm.Config.Props = {},
    ): Integration.Domain.Realm.Repositories.Context {
        const config = this.config(props);

        return {
            accountRoleAssignments: new AccountRoleAssignmentRepository(context.readManager, config),
            permissionOverrides: new PermissionOverrideRepository(context.readManager, config),
            permissions: new PermissionRepository(context.readManager, config),
            realms: new RealmRepository(context.readManager, config),
            roles: new RoleRepository(context.readManager, config),
        };
    }

    public async seedSystemPermissions(
        suite: Integration.Domain.Realm.Suite,
    ): Integration.Domain.Realm.SeedSystemPermissions.Result {
        return await suite.transaction(async (transaction) => {
            const realm = this.entities.createRealm({
                id: SYSTEM_REALM_ID,
                isSystemManaged: true,
                owner: SYSTEM_REALM_ID,
                code: "system",
                name: "System",
            });

            transaction.persist(realm);

            for (const code of ADMIN_PERMISSION_CODES) {
                transaction.persist(
                    this.entities.createPermission({
                        isSystemManaged: true,
                        name: code,
                        realm,
                        code,
                    }),
                );
            }

            await transaction.flush();

            return realm;
        });
    }

    private config(props: Integration.Domain.Realm.Config.Props): ConfigService {
        return new ConfigService({
            PERMISSION_OVERRIDE_PER_ACCOUNT_LIMIT: 10,
            REALM_LIMIT: props.realmLimit ?? 3,
            PERMISSION_PER_REALM_LIMIT: 3,
            ROLE_PER_ACCOUNT_LIMIT: 10,
            ROLE_PER_REALM_LIMIT: 10,
        });
    }
}
