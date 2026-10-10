declare namespace Repositories.RoleConflictMember {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.RoleConflictMember,
        Repositories.Mappers.RoleConflictMember.Types
    > {
        wouldExceedMemberLimit: WouldExceedMemberLimit.Signature;
    }

    interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}

    namespace WouldExceedMemberLimit {
        type Props = {
            transaction?: ORM.EntityManager;
            group: string;
            count: number;
        };

        type Result = Promise<boolean>;

        type Signature = (props: Props) => Result;
    }
}
