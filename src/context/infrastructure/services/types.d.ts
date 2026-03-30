declare namespace Services {
    namespace PermissionCache {
        interface Contract {
            has: (props: Has) => Promise<string[]>;
            exists: (props: Exists) => Promise<boolean>;
            hasGlobal: (props: HasGlobal) => Promise<string[]>;
            hasRealm: (props: HasRealm) => Promise<boolean>;
            getRealms: (props: GetRealms) => Promise<string[]>;
            populate: (props: Populate) => Promise<void>;
            invalidate: (props: Invalidate) => Promise<void>;
        }

        type Has = {
            permissions: string[];
            account: string;
            realm: string;
        };

        type HasGlobal = {
            permissions: string[];
            account: string;
        };

        type HasRealm = {
            account: string;
            realm: string;
        };

        type GetRealms = {
            account: string;
        };

        type Exists = {
            account: string;
        };

        type Populate = {
            rows: Repositories.Permission.CollectEffective.Result;
            realms: string[];
            account: string;
        };

        type Invalidate = {
            accounts: string[];
        };
    }
}
