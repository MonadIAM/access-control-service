import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { ConfigService } from "@nestjs/config";

import { PermissionOverrideRepository } from "~context/infrastructure/repositories/permission-override.repository";
import { PermissionRepository } from "~context/infrastructure/repositories/permission.repository";
import { PermissionOverrideService } from "~context/domain/services/permission-override.service";
import { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import { Realm } from "~context/domain/entities";

export class PermissionOverrideIntegrationHelpers implements Integration.Domain.PermissionOverride.Contract {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.PermissionOverride.Config.Props = {},
    ): Integration.Domain.PermissionOverride.Service.Context {
        const repositories = this.repositories(context, props);

        return {
            permissionOverrideService: new PermissionOverrideService(
                repositories.permissionOverrides,
                repositories.permissions,
                repositories.realms,
            ),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.PermissionOverride.Config.Props = {},
    ): Integration.Domain.PermissionOverride.Repositories.Context {
        const config = this.config(props);

        return {
            permissionOverrides: new PermissionOverrideRepository(context.readManager, config),
            permissions: new PermissionRepository(context.readManager, config),
            realms: new RealmRepository(context.readManager, config),
        };
    }

    public async seedSystemRealm(
        suite: Integration.Domain.PermissionOverride.Suite,
    ): Integration.Domain.PermissionOverride.SeedSystemRealm.Result {
        return await suite.transaction(async (transaction) => {
            const realm = new Realm({
                owner: SYSTEM_REALM_ID,
                code: "system",
                name: "System",
            });

            realm.id = SYSTEM_REALM_ID;
            transaction.persist(realm);
            await transaction.flush();

            return realm;
        });
    }

    private config(props: Integration.Domain.PermissionOverride.Config.Props): ConfigService {
        return new ConfigService({
            PERMISSION_OVERRIDE_PER_ACCOUNT_LIMIT: props.overrideLimit ?? 3,
            PERMISSION_PER_REALM_LIMIT: 3,
            REALM_LIMIT: 3,
        });
    }
}
