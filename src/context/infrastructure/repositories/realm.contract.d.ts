declare namespace Repositories.Realm {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<Entities.Realm, Repositories.Mappers.Realm.Types> {
        wouldExceedRealmLimit: WouldExceedRealmLimit.Signature;
        getLookupList: GetLookupList.Signature;
    }

    interface QueryContract extends Pick<PublicContract, "getLookupList" | "findUniqueOrThrow" | "findMany"> {}

    namespace WouldExceedRealmLimit {
        type Props = {
            transaction?: ORM.EntityManager;
            account: string;
            count?: number;
        };

        type Result = Promise<boolean>;

        type Signature = (props: Props) => Result;
    }

    namespace GetLookupList {
        type Props = {
            pagination: Pagination;
            realms?: string[];
            term: string;
        };

        type Result = Promise<[Entities.Realm[], number]>;

        type Signature = (props: Props) => Result;
    }
}
