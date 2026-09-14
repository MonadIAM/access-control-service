import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { ConfigService } from "@nestjs/config";

import { PermissionRepository } from "~context/infrastructure/repositories/permission.repository";
import { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import { ADMIN_PERMISSION_CODES } from "~infrastructure/datasets/bootstrap";
import { RealmService } from "~context/domain/services/realm.service";
import { Permission, Realm } from "~context/domain/entities";

export class RealmIntegrationHelpers implements Integration.Domain.Realm.Contract {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.Realm.Config.Props = {},
    ): Integration.Domain.Realm.Service.Context {
        const repositories = this.repositories(context, props);

        return {
            realmService: new RealmService(repositories.permissions, repositories.realms),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.Realm.Config.Props = {},
    ): Integration.Domain.Realm.Repositories.Context {
        const config = this.config(props);

        return {
            permissions: new PermissionRepository(context.readManager, config),
            realms: new RealmRepository(context.readManager, config),
        };
    }

    public async seedSystemPermissions(
        suite: Integration.Domain.Realm.Suite,
    ): Integration.Domain.Realm.SeedSystemPermissions.Result {
        return await suite.transaction(async (transaction) => {
            const realm = new Realm({
                isSystemManaged: true,
                owner: SYSTEM_REALM_ID,
                code: "system",
                name: "System",
            });

            realm.id = SYSTEM_REALM_ID;
            transaction.persist(realm);

            for (const code of ADMIN_PERMISSION_CODES) {
                transaction.persist(
                    new Permission({
                        name: code,
                        isSystemManaged: true,
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
            PERMISSION_PER_REALM_LIMIT: 3,
            REALM_LIMIT: props.realmLimit ?? 3,
        });
    }
}
