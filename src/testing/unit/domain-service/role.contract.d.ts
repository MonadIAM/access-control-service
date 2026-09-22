declare namespace Unit.Domain.Role {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            roles?: Entities.Role[];
            realm?: Entities.Realm;
            subtreeLimit?: number;
        };

        type Result = Core.Service.Context<Services.Role.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
