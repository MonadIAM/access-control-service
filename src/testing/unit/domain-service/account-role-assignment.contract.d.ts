declare namespace Unit.Domain.AccountRoleAssignment {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            roles?: Entities.Role[];
            realm?: Entities.Realm;
        };

        type Result = Core.Service.Context<Services.AccountRoleAssignment.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
