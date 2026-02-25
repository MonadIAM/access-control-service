declare namespace Services {
    namespace PermissionCache {
        interface Contract {
            has: (props: Has) => Promise<boolean>;
            exists: (props: Exists) => Promise<boolean>;
            hasGlobal: (props: HasGlobal) => Promise<boolean>;
            populate: (props: Populate) => Promise<void>;
            invalidate: (props: Invalidate) => Promise<void>;
        }

        type Has = {
            permission: string;
            account: string;
            realm: string;
        };

        type HasGlobal = {
            permission: string;
            account: string;
        };

        type Exists = {
            account: string;
        };

        type Populate = {
            rows: Repositories.Permission.CollectEffectivePermissions.Result;
            account: string;
        };

        type Invalidate = {
            account: string;
        };
    }
}
