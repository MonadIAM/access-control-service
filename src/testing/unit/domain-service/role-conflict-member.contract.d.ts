declare namespace Unit.Domain.RoleConflictMember {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            roles?: Entities.Role[];
            realm?: Entities.Realm;
        };

        type Result = Core.Service.Context<Services.RoleConflictMember.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
