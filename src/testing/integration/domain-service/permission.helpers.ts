import { ConfigService } from "@nestjs/config";

import { PermissionRepository } from "~context/infrastructure/repositories/permission.repository";
import { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import { PermissionService } from "~context/domain/services/permission.service";

export class PermissionIntegrationHelpers implements Integration.Domain.Permission.Contract {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.Permission.Config.Props = {},
    ): Integration.Domain.Permission.Service.Context {
        const repositories = this.repositories(context, props);

        return {
            permissionService: new PermissionService(repositories.permissions, repositories.realms),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.Permission.Config.Props = {},
    ): Integration.Domain.Permission.Repositories.Context {
        const config = this.config(props);

        return {
            permissions: new PermissionRepository(context.readManager, config),
            realms: new RealmRepository(context.readManager, config),
        };
    }

    private config(props: Integration.Domain.Permission.Config.Props): ConfigService {
        return new ConfigService({
            PERMISSION_PER_REALM_LIMIT: props.permissionLimit ?? 3,
            REALM_LIMIT: 3,
        });
    }
}
