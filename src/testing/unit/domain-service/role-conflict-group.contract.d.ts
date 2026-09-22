declare namespace Unit.Domain.RoleConflictGroup {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            roles?: Entities.Role[];
            realm?: Entities.Realm;
            membersLimit?: number;
        };

        type Result = Core.Service.Context<Services.RoleConflictGroup.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
