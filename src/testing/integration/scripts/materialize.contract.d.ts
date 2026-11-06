import Redis from "ioredis";

declare global {
    namespace Integration.Projection.Materialize {
        type Scenario = {
            realm: Entities.Realm;
            parent: Entities.Role;
            child: Entities.Role;
            sibling: Entities.Role;
            permission: Entities.Permission;
            account: string;
        };
        type Assigned = Scenario & {
            grant: Entities.RolePermissionAssignment;
            assignment: Entities.AccountRoleAssignment;
        };
        type Global = Scenario & {
            local: Entities.Realm;
            role: Entities.Role;
            grant: Entities.RolePermissionAssignment;
            localGrant: Entities.RolePermissionAssignment;
        };
        type Expiring = Scenario & { deadline: Date };
        type Context = {
            transactional: Integration.TransactionalHelper.CreateTransactionalServiceContext.Result;
            consumed: Set<string>;
            permissions: Repositories.Permission.Contract;
            commands: {
                assignment: Commands.AccountRoleAssignment.Contract;
                override: Commands.PermissionOverride.Contract;
                permission: Commands.Permission.Contract;
                grant: Commands.RolePermissionAssignment.Contract;
                realm: Commands.Realm.Contract;
                role: Commands.Role.Contract;
            };
        };
        type Assert = {
            context: Context;
            executor: InfrastructureServices.ScriptExecutor.Contract;
            redis: Redis;
            account: string;
            realm: string;
            permissionRealm: string;
            expected: string[];
            global?: string[];
        };
    }
}
